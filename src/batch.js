import { 
	account,
	getNestedField
} from './utils';

export const handleBatch = async ({
	event, jsonHeaders,
	cache, cacheKey, cacheMaxAge,
	params,
}) => {

	let { views } = params;

	views = views.map(({ contract, method, args, batch, sort }) => {
		const promises = [];
		if (batch) {
			const keys = Object.keys(batch);
			const vals = Object.values(batch);
			// TODO loop big numbers in case offset was huge (use BN.js)
			const valInts = vals.map((v) => parseInt(v));
			for (let i = valInts[0]; i < valInts[1]; i += valInts[2]) {
				const offset = i.toString();
				promises.push(account.viewFunction(contract, method, {
					...args,
					...{
						[keys[0]]: offset,
						[keys[1]]: vals[2],
					}
				}));
			}
		}
		return {
			promises,
			batch,
			sort,
		};
	});
    
	// await all responses
	for (let i = 0; i < views.length; i++) {
		const { promises } = views[i];
		const responses = [];
		for (let i = 0; i < views.length; i++) {
			responses.push(await promises[i]);
		}
		delete views[i].promises;
		views[i].responses = responses;
	}
    
	// flatten and sort
	views = views.map(({ responses, batch, sort }) => {
		const { flatten } = batch;
    
		let result = responses;
		if (Array.isArray(flatten)) {
			result = responses.reduce((a, c) => a.concat(c), flatten);
    
			if (sort) {
				const { path, how = 'desc', parse = 'int' } = sort;
				result.forEach((r) => r.__sortIndex = getNestedField(r, path, parse));
				if (how === 'desc') {
					result.sort((b, a) => a.__sortIndex - b.__sortIndex);
				} else {
					result.sort((a, b) => a.__sortIndex - b.__sortIndex);
				}
			}
    
		} else {
			// TODO flatten {}
			// result = result.reduce((a, c) => Object.assign(a, c), flatten)
		}
    
		return result;
	});
    
	const response = new Response(JSON.stringify(views), {
		headers: Object.assign(jsonHeaders, {
			'cache-control': 's-maxage=' + cacheMaxAge
		}),
	});
	event.waitUntil(cache.put(cacheKey, response.clone()));
	response.headers.append("cached", "false");
	return response;
};


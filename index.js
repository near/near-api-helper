import { handleOptions, corsHeaders } from './src/cors';
import { checkCache } from './src/cache';
import { 
	account,
	getNestedField
} from './src/utils';

const responseHeaders = Object.assign({
	'content-type': 'application/json',
	"Cache-Control": "s-maxage=30"
}, corsHeaders);

/// example call

// await fetch('https://helper.nearapi.org/v1/testnet/view', {
// 	method: 'POST',
// 	body: JSON.stringify({
// 		views: [{
// 			contract: 'dev-1618440176640-7650905',
// 			method: 'nft_tokens',
// 			args: {},
// 			batch: {
// 				from_index: '0', // must be name of contract arg (above)
// 				limit: '500', // must be name of contract arg (above)
// 				step: '100', // divides contract arg 'limit'
// 				flatten: [], // how to combine results
// 			},
// 			sort: {
// 				path: 'metadata.issued_at',
// 			}
// 		},
// 		{
// 			contract: 'market.dev-1618440176640-7650905',
// 			method: 'get_sales_by_nft_contract_id',
// 			args: {
// 				nft_contract_id: 'dev-1618440176640-7650905'
// 			},
// 			batch: {
// 				from_index: '0', // must be name of contract arg (above)
// 				limit: '500', // must be name of contract arg (above)
// 				step: '100', // divides contract arg 'limit'
// 				flatten: [], // how to combine results
// 			},
// 			sort: {
// 				path: 'conditions.near',
// 				parse: 'BN'
// 			}
// 		}],
// 	})
// }).then(r => r.json())

addEventListener('fetch', event => {
	const { request } = event
	if (request.method === "OPTIONS") {
		event.respondWith(handleOptions(request))
		return
	}
	event.respondWith(handleRequest(event))
})

async function handleRequest(event) {
	const { request } = event
	const { method } = request
	if (method !== 'POST') {
		return new Response(JSON.stringify({ error: 'POST only with application/json' }), {
			headers: responseHeaders,
		})
	}

	const url = new URL(request.url)
	const { cache, cachedResponse, cacheKey } = await checkCache({ request, url, responseHeaders })
	if (cachedResponse) {
		return cachedResponse
	}

	let { views } = await request.json()
	
	// expand batch views and make all calls for all views
	views = views.map(({ contract, method, args, batch, sort }) => {
		const promises = []
		if (batch) {
			const keys = Object.keys(batch)
			const vals = Object.values(batch)
			// TODO loop big numbers in case offset was huge (use BN.js)
			const valInts = vals.map((v) => parseInt(v))
			for (let i = valInts[0]; i < valInts[1]; i += valInts[2]) {
				const offset = i.toString()
				promises.push(account.viewFunction(contract, method, {
					...args,
					...{
						[keys[0]]: offset,
						[keys[1]]: vals[2],
					}
				}))
			}
		}
		return {
			promises,
			batch,
			sort,
		}
	})
	
	// await all responses
	for (let i = 0; i < views.length; i++) {
		const { promises } = views[i]
		const responses = []
		for (let i = 0; i < views.length; i++) {
			responses.push(await promises[i])
		}
		delete views[i].promises
		views[i].responses = responses
	}

	// flatten and sort
	views = views.map(({ responses, batch, sort }) => {
		const { flatten } = batch

		let result = responses
		if (Array.isArray(flatten)) {
			result = responses.reduce((a, c) => a.concat(c), flatten)

			if (sort) {
				const { path, how = 'desc', parse = 'parseInt' } = sort
				result.forEach((r) => r.__sortIndex = getNestedField(r, path, parse))
				if (how === 'desc') {
					result.sort((b, a) => a.__sortIndex - b.__sortIndex)
				} else {
					result.sort((a, b) => a.__sortIndex - b.__sortIndex)
				}
			}

		} else {
			// TODO flatten {}
			// result = result.reduce((a, c) => Object.assign(a, c), flatten)
		}

		return result
	})

	console.log('final result', views)
	
	const response = new Response(JSON.stringify({
		views,
		debug: {
			cacheKey,
		}
	}), {
		headers: responseHeaders,
	})
    event.waitUntil(cache.put(cacheKey, response.clone()))
	response.headers.append("cached", "false")
	return response
}

import { 
	account,
	getNestedField,
} from './utils';

import { encode } from '@msgpack/msgpack';
import { fromByteArray } from 'base64-js';

export const handleView = async ({
	event, url, params, corsHeaders, jsonHeaders, userAgent,
	cache, cacheKey, cacheMaxAge,
}) => {
	const { contract, method, args, actions } = params;
	const { field, botMap, redirect, encodeUrl, batch } = actions;

	// return encoded url (or redirect to it)
	if (encodeUrl) {
		const base64 = fromByteArray(encode({ contract, method, args, actions:{
			field, botMap, redirect
		}}));
		const encodedUrl = url.origin + '/v1/e/' + base64;
		return new Response(JSON.stringify({ encodedUrl }), { headers: jsonHeaders });
	}

	// not a bot
	if (redirect && !/facebookexternalhit|Discordbot|Twitterbot|LinkedInBot|TelegramBot/gi.test(userAgent)) {
		return Response.redirect(decodeURIComponent(redirect), 301);
	}

	// get raw rpc response
	let rpcResponse = await account.viewFunction(contract, method, args);

	// get specified field
	if (field) {
		rpcResponse = getNestedField(rpcResponse, field);
		const path = field.split('.');
		rpcResponse = {
			[path[path.length-1]]: rpcResponse
		};
	}
    
	let response;
	if (botMap) {
		// TODO how to handle the botResponse, further details in nested action
		response = new Response(botTemplate(botMap, rpcResponse), {
			headers: Object.assign(corsHeaders, {
				'content-type': 'text/html',
				'cache-control': 's-maxage=' + cacheMaxAge,
			}),
		});
	} else {
		response = new Response(JSON.stringify(rpcResponse), { headers: jsonHeaders });
	}
    
	event.waitUntil(cache.put(cacheKey, response.clone()));
	response.headers.append('cached', 'false');

	return response;
};

const botTemplate = (botMap, rpcResponse) => {
	const botMapImage = botMap['og:image'];
	const src = typeof botMapImage === 'string' ? botMapImage : getNestedField(rpcResponse, botMapImage.field);

	return `
<!doctype html>
<html lang="en">
<head>
${
	Object.entries(botMap)
		.map(([k, v]) => `<meta property="${k}" content="${
			typeof v === 'string' ? v : getNestedField(rpcResponse, v.field)
		}" />`)
		.join('\n\t')
}
<meta property="og:description" content="Your friend sent you a NEAR Link" />
<meta name="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="https://near.org"></meta>
<meta property="twitter:image:alt" content="NEAR Link"></meta>
</head>
<body>
${ src ? `<img src="${src}" />` : '' }
</body>
</html>
`;
};
import { handleOptions, corsHeaders, jsonHeaders } from './src/cors';
import { checkCache } from './src/cache';
import { handleView } from './src/view';
import { handleBatch } from './src/batch'
import { getParamsObj } from './src/utils';
import { pathToArgs } from './src/path';

addEventListener('fetch', (event) => {
	const { request } = event
	if (request.method === "OPTIONS") {
		event.respondWith(handleOptions(request))
		return
	}
	event.respondWith(wrapRequest(event))
})

async function wrapRequest(event) {
	try {
		return await handleRequest(event)
	} catch(e) {
		console.warn(e)
		return new Response(JSON.stringify({ error: e.toString() }), {
			headers: jsonHeaders,
			status: 500,
		})
	}
}

async function handleRequest(event) {
	const { request } = event
    const userAgent = request.headers.get('user-agent') || ""
	const url = new URL(request.url)
	const { searchParams, pathname } = url
	if (pathname === '/favicon.ico') return new Response("")
	let params = getParamsObj(searchParams)
	const { cacheMaxAge = '30' } = params

	// qualify path and args
	const pathArgs = pathToArgs(pathname)
	Object.assign(params, pathArgs)

	// // unpack encodedUrls here
	// if (params.p) {
	// 	params = decode(toByteArray(params.p))
	

	// 	console.log('decoded', params)
	// }

	// // if there's a cached response, serve it
	const { cache, cachedResponse, cacheKey } = await checkCache({ request, url, corsHeaders })
	if (cachedResponse) {
		return cachedResponse
	}

	const methodArgs = {
		event, request, url, params, userAgent,
		jsonHeaders, corsHeaders,
		cache, cacheKey, cacheMaxAge,
	}

	switch (request.method) {
		case 'GET': 
			if (!params.batch) {
				return await handleView(methodArgs)
			}
			return await handleBatch(methodArgs)
		break;
	}

}

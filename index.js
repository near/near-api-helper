import { handleOptions, corsHeaders, jsonHeaders } from './src/cors';
import { checkCache } from './src/cache';
import { handleView } from './src/view';
import { handleBatch } from './src/batch'
import { handleUpload, handleShare } from './src/upload'
import { handleRedirect } from './src/redirect'
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
	const { headers } = request
    const userAgent = headers.get('user-agent') || ''
    const networkId = headers.get('near-network') || 'testnet'
    const signature = JSON.parse(headers.get('near-signature') || '{}')
	const url = new URL(request.url)
	const { searchParams, pathname } = url
	if (pathname === '/favicon.ico') return new Response('')
	let params = getParamsObj(searchParams)
    let cacheMaxAge = headers.get('max-age') || '60'

	// qualify path and args
	const pathArgs = pathToArgs(pathname)
	Object.assign(params, pathArgs)

	// '0' max-age means : "skip cache"
	// if there's a cached response, serve it
	const { cache, cachedResponse, cacheKey } = await checkCache({ request, params, url, corsHeaders, cacheMaxAge })
	if (cachedResponse) {
		return cachedResponse
	}
	if (cacheMaxAge === '0') {
		cacheMaxAge = '60'
	}

	const methodArgs = {
		event, request, url, params, userAgent, signature,
		jsonHeaders, corsHeaders,
		cache, cacheKey, cacheMaxAge, networkId,
	}

	switch (request.method) {
		case 'GET': 
			switch (params.type) {
				case 'share': return await handleShare(methodArgs)
				case 'view': return await handleView(methodArgs)
				case 'batch': return await handleBatch(methodArgs)
			}
		case 'POST': 
			switch (params.type) {
				case 'batch': 
					params.views = await request.json()
					return await handleBatch(methodArgs)
				case 'upload': return await handleUpload(methodArgs)
				case 'redirect': return await handleRedirect(methodArgs)
			}
	}

}

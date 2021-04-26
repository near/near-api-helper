const sha256 = async (message) => {
	const msgBuffer = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => ("00" + b.toString(16)).slice(-2)).join("");
	return hashHex;
};

export const checkCache = async ({ request, url }) => {
	let { method } = request;

	const cache = caches.default;
	const body = method === 'POST' && await request.clone().text();
	const hash = await sha256(url.toString() + body);
	const cacheUrl = new URL(url.origin);
	cacheUrl.pathname = '/c/' + hash;
	const cacheKey = cacheUrl.toString();

	let cachedResponse = await cache.match(cacheKey);

	if (cachedResponse) {
		cachedResponse = new Response(cachedResponse.body);
		cachedResponse.headers.append('cached', 'true');
		return { cache, cachedResponse, cacheKey };
	}
    
	return {cache, cachedResponse: false, cacheKey};
};
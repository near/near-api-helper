const sha256 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message)
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => ("00" + b.toString(16)).slice(-2)).join("")
    return hashHex
}

export const checkCache = async ({ request, url, responseHeaders }) => {
    const body = await request.clone().text()
    const hash = await sha256(body)
    const cacheUrl = new URL(request.url)
    cacheUrl.pathname = "/request/" + hash
    const cacheKey = cacheUrl.toString()
    const cache = caches.default
    let cachedResponse = await cache.match(cacheKey)
    if (cachedResponse) {
        cachedResponse = new Response(cachedResponse.body, {
            headers: responseHeaders,
        })
        cachedResponse.headers.append("cached", "true")
        return {cachedResponse, cacheKey}
    }
    return {cache, cachedResponse: false, cacheKey}
}
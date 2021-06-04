const FILE_HOST = 'https://files.nearapi.org/file/nearapi/'

export const handleRedirect = async ({
    params, userAgent, corsHeaders, cacheMaxAge,
	event, cache, cacheKey
}) => {
    const { redirect, fn, title, description } = params
    
	// not bot, redirect to url in params of link or direct to image
	if (!/facebookexternalhit|Slackbot|WhatsApp|Snapchat|Applebot|Discordbot|Twitterbot|LinkedInBot|TelegramBot/gi.test(userAgent)) {
        return Response.redirect(decodeURIComponent(redirect), 301);
	}

    // bot response
    const map = {
        'image': FILE_HOST + fn,
    }
    if (title.length) map.title = title
    if (description.length) map.description = description
    const response = new Response(botTemplate(map), {
        headers: Object.assign(corsHeaders, {
            'content-type': 'text/html',
            'cache-control': 's-maxage=' + cacheMaxAge,
        }),
    });

	event.waitUntil(cache.put(cacheKey, response.clone()));
	response.headers.append('cached', 'false');

	return response;
};

const botTemplate = (map) => {
	const src = map['image'];
    return `
<!doctype html>
<html lang="en">
<head>
${
    Object.entries(map)
        .map(([k, v]) => `<meta property="og:${k}" content="${v}" />`)
        .join('\n\t')
}
${
    Object.entries(map)
        .map(([k, v]) => `<meta property="twitter:${k}" content="${v}" />`)
        .join('\n\t')
}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@nearprotocol"></meta>
<meta name="twitter:image:alt" content="Image Link from NEAR Protocol App"></meta>
</head>
<body>
${ src ? `<img src="${src}" />` : '' }
</body>
</html>
`;
};
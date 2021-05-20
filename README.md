

# NEAR API Helper


Batch near-api-js RPC calls.

Optionally flatten and sort arrays of objects.

## 🚨 Warning this is WIP 🚨
- Not officially supported (yet)
- Potential syntax changes
- For now route does nothing (v1/testnet/view only example)

## Notes
I am aware snake_case and JSON in REST is ugly. However, not willing to convert all method names and args from what you would normally use with near-api-js. e.g. maintain consistency between these API calls and RPC calls as best I can.

## Syntax
```bash
# GET (note with http you need to escape the JSON with single quotes first)
http https://helper.nearapi.org/v1/contract/dev-1618440176640-7650905/nft_token/'{"token_id":"token-1619265007329"}'
```

# Example calls from client side:
```js
// consts
const domain = 'http://127.0.0.1:8787'; // wrangler dev local testing
// const domain = 'https://helper.nearapi.org/v1/contract/' // testnet helper domain
const domainAndPath = domain + '/v1/contract/';
const testNFTPath = domainAndPath + 'dev-1618440176640-7650905/nft_token/';
const batchPath = domain + '/v1/batch/';
```


## It should have the whole rpc response


Returns a raw response for a given view near-api-js call (viewFunction)


```javascript
const args = JSON.stringify({
	token_id: 'token-1619265007329'
});
const url = testNFTPath + args;
console.log('\n URL:\n', url, '\n');
const response = await fetch(url).then((res) => res.json());

assert.strictEqual(Object.keys(response).length > 1, true);
```

## It should return just a field with the last field name as key


Use this to drill into JSON responses (e.g. get metadata for a token)


```javascript
const args = JSON.stringify({
	token_id: 'token-1619265007329'
});
const actions = JSON.stringify({
	field: 'metadata.media'
});
const url = testNFTPath + args + '/' + actions;
console.log('\n URL:\n', url, '\n');
const response = await fetch(url).then((res) => res.json());

assert.strictEqual(Object.keys(response).length, 1);
```

## It should have a bot response with customized fields


Creates a bot response for when you share your links (link previews with images etc...)


```javascript
const args = JSON.stringify({
	token_id: 'token-1619265007329'
});
const actions = JSON.stringify({
	botMap: {
		'og:title': 'MEOW',
		'og:image': { field: 'metadata.media' }
	}
});
const url = testNFTPath + args + '/' + actions;
console.log('\n URL:\n', url, '\n');
const response = await fetch(url, {
	headers: {
		'user-agent': 'facebookexternalhit'
	}
}).then((res) => res.text());

console.log(response);

assert.strictEqual(response.indexOf('MEOW') > -1, true);
```

## It should return an encoded url


Turn your call into an encoded URL that you can use for sharing (prettier than JSON in REST)

botMap for bots -> link preview
redirect for users -> NFT item


```javascript
const args = JSON.stringify({
	token_id: 'token-1619265007329'
});
const actions = JSON.stringify({
	botMap: {
		'og:title': 'MEOW',
		'og:image': { field: 'metadata.media' }
	},
	redirect: 'https%3A%2F%2Fnear-apps.github.io%2Fnft-market%2F',
	encodeUrl: true,
});
const url = testNFTPath + args + '/' + actions;
console.log('\n URL:\n', url, '\n');
const response = await fetch(url).then((res) => res.json());
assert.strictEqual(Object.keys(response)[0], 'encodedUrl');

// redirect will return html from market which should not contain the string MEOW
const encodedUrl = Object.values(response)[0];
console.log('\n URL:\n', encodedUrl, '\n');
const response2 = await fetch(encodedUrl).then((res) => res.text());
assert.strictEqual(response2.indexOf('MEOW') === -1, true);
```

## It should return a batched response


Use this to get a lot of data at once.

Call different view methods.

Within each call, the first and second arguments of batch must have names matching the contract arguments used for offset and limit.

e.g. if the contract has args like "offset" and "num", you need to use: batch: { offset: '0', num: '100', step: '10' }

This means "start at '0' and keep making RPC calls until '100' increasing by '10' each time." creating a total of 10 RPC calls in the helper, but only 1 call and reponse for the user.

flatten: [] combines results into an array vs. separate RPC results

WIP
sort.field: what field on the objects to use for sorting
sort.parse: how to treat the field "int": parseInt or "bn": parseFloat(parseNearAmount(val, 8)) // 8 decimal approximation of NEAR


```javascript
const batch = [{
	contract: 'dev-1618440176640-7650905',
	method: 'nft_tokens',
	args: {},
	batch: {
		from_index: '0', // must be name of contract arg (above)
		limit: '200', // must be name of contract arg (above)
		step: '10', // divides contract arg 'limit'
		flatten: [], // how to combine results
	},
	sort: {
		path: 'metadata.issued_at',
	}
},
{
	contract: 'market.dev-1618440176640-7650905',
	method: 'get_sales_by_nft_contract_id',
	args: {
		nft_contract_id: 'dev-1618440176640-7650905'
	},
	batch: {
		from_index: '0', // must be name of contract arg (above)
		limit: '100', // must be name of contract arg (above)
		step: '10', // divides contract arg 'limit'
		flatten: [], // how to combine results
	},
	sort: {
		path: 'conditions.near',
		parse: 'bn'
	}
}];

const url = batchPath + JSON.stringify(batch);
console.log('\n URL:\n', url, '\n');

const response = await fetch(batchPath + JSON.stringify(batch)).then((res) => res.json());

assert.strictEqual(response.length, 2);
assert.strictEqual(response[0].length > 20, true);
assert.strictEqual(response[1].length > 0, true);
```

## It should return a batched response


Mainnet Test


```javascript
const batch = [{
	contract: 'nft_679bada6b8.near-hackathon.collab-land.near',
	method: 'nft_tokens',
	args: {},
	batch: {
		from_index: '0', // must be name of contract arg (above)
		limit: '1000', // must be name of contract arg (above)
		step: '50', // divides contract arg 'limit'
		flatten: [], // how to combine results
	},
}];

const url = batchPath + JSON.stringify(batch);
console.log('\n URL:\n', url, '\n');

const response = await fetch(batchPath + JSON.stringify(batch), {
	headers: {
		'near-network': 'mainnet'
	}
}).then((res) => res.json());

assert.strictEqual(response[0].length > 300, true);
```

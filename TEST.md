

# /view



# near-api-helper

Batch near-api-js RPC calls.

Optionally flatten and sort arrays of objects.

# 🚨 WIP 🚨

- Not officially supported (yet)
- Potential syntax changes
- For now route does nothing (v1/testnet/view only example)

### Example call from client side



## It should have the whole rpc response

```javascript
const response = await fetch(domainAndPath + 'dev-1618440176640-7650905/nft_token/{"token_id":"token-1619265007329"}').then((res) => res.json())

assert.strictEqual(Object.keys(response).length > 1, true)
```

## It should have the whole rpc response

```javascript
const response = await fetch(domainAndPath + 'dev-1618440176640-7650905/nft_token/{"token_id":"token-1619265007329"}/{"field":"metadata.media"}').then((res) => res.json())

assert.strictEqual(Object.keys(response).length, 1)
```

## It should return an encoded url

```javascript
const response = await fetch(domainAndPath + 'dev-1618440176640-7650905/nft_token/{"token_id":"token-1619265007329"}/{"botMap":{"og:image":{"field":"metadata.media"}},"redirect":"https%3A%2F%2Fnear-apps.github.io%2Fnft-market%2F","encodeUrl":true}').then((res) => res.json())
        
assert.strictEqual(Object.keys(response)[0], 'encodedUrl')
```

## It should have a bot response with customized fields

```javascript
const response = await fetch(domainAndPath + 'dev-1618440176640-7650905/nft_token/{"token_id":"token-1619265007329"}/{"botMap":{"og:title":"MEOW","og:image":{"field":"metadata.media"}}}', { 
    headers: {
        'user-agent': 'facebookexternalhit'
    }
}).then((res) => res.text())

assert.strictEqual(response.indexOf('MEOW') > -1, true)
```

## It should return a batched response

```javascript
this.timeout(5000);

const batch = [{
    contract: 'dev-1618440176640-7650905',
    method: 'nft_tokens',
    args: {},
    batch: {
        from_index: '0', // must be name of contract arg (above)
        limit: '500', // must be name of contract arg (above)
        step: '100', // divides contract arg 'limit'
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
        limit: '500', // must be name of contract arg (above)
        step: '100', // divides contract arg 'limit'
        flatten: [], // how to combine results
    },
    sort: {
        path: 'conditions.near',
        parse: 'bn'
    }
}]
const response = await fetch(batchPath + JSON.stringify(batch)).then((res) => res.json())
        
assert.strictEqual(response.length, 2)
assert.strictEqual(response[0].length > 0, true)
assert.strictEqual(response[1].length > 0, true)
```

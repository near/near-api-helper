# near-api-helper

Batch near-api-js RPC calls.

Optionally flatten and sort arrays of objects.

# 🚨 WIP 🚨 

- Not officially supported (yet)
- Potential syntax changes
- For now route does nothing (v1/testnet/view only example)

### Example call from client side

```js
await fetch('https://helper.nearapi.org/v1/testnet/view', {
	method: 'POST',
	body: JSON.stringify({
		views: [{
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
				parse: 'BN'
			}
		}],
	})
}).then(r => r.json())
```


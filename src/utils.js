import {
	Near, Account, keyStores, utils
} from 'near-api-js'

const { format: { parseNearAmount } } = utils
const n2f = (amount) => parseFloat(parseNearAmount(amount, 8));

/// NEAR
export const near = new Near({
	networkId: 'default',
	nodeUrl: 'https://rpc.testnet.near.org',
	deps: {
		keyStore: new keyStores.InMemoryKeyStore()
	},
});
export const account = new Account(near.connection, 'testnet')

/// JS
export const getNestedField = (obj, path, parse) => {
	const fields = path.split('.')
	try {
		for (let i = 0; i < fields.length; i++) {
			obj = obj[fields[i]]
		}
		if (parse === 'parseInt') {
			return !!obj ? parseInt(obj) : 0
		}
		if (parse === 'BN') {
			return !!obj ? n2f(obj) : n2f('0')
		}
		return obj
	} catch (e) { }
	// error finding field
	if (parse === 'parseInt') {
		return 0
	}
	if (parse === 'BN') {
		return n2f('0')
	}
	return obj
}
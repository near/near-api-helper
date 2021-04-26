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
export const getNestedField = (obj, field, parse) => {
	const path = field.split('.')
	try {
		for (let i = 0; i < path.length; i++) {
			obj = obj[path[i]]
		}
		if (parse === 'int') {
			return !!obj ? parseInt(obj) : 0
		}
		if (parse === 'bn') {
			return !!obj ? n2f(obj) : n2f('0')
		}
		return obj
	} catch (e) { }
	// error finding field
	if (parse === 'int') {
		return 0
	}
	if (parse === 'bn') {
		return n2f('0')
	}
	return obj
}

// CFW

export const getParamsObj = (params) => {
	const paramsObj = {}
    for (let [k, v] of params.entries()) {
        paramsObj[k] = v
    }
	return paramsObj
}
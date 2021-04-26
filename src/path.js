

import { decode } from '@msgpack/msgpack'
import { toByteArray } from 'base64-js'

export const pathToArgs = (pathname) => {
    const path = pathname.split('/')

    // encoded path
	if (path[1] === 'v1' && path[2] === 'e') {
		let decoded = path[3]
		try {
			decoded = decode(toByteArray(decoded))
		} catch (e) {
			throw 'unable to decode url'
		}
        return decoded
    }

	// batch path
	let args
	if (path[1] === 'v1' && path[2] === 'batch') {
		args = path[3]
		try {
			args = JSON.parse(decodeURIComponent(args))
		} catch (e) {
			throw 'unable to parse batch args /v1/batch/[args]'
		}
		return { batch: true, views: args }
    }

	// contract path
	if (path[1] !== 'v1' || path[2] !== 'contract') {
		throw 'supports /v1/contract/[contractName]/[methodName]/[args]/[actions]'
	}
	const contract = path[3]
	if (!contract) throw 'missing /v1/contract/[contractName]'
	const method = path[4]
	if (!method) throw 'missing /v1/contract/[contractName]/[methodName]'

	args = path[5] || {}
	if (!!args.length) {
		try {
			args = JSON.parse(decodeURIComponent(args))
		} catch (e) {
			throw 'unable to parse args /v1/contract/[contractName]/[methodName]/[args]: ' + args
		}
	}

	let actions = path[6] || {}
	if (!!actions.length) {
		try {
			actions = JSON.parse(decodeURIComponent(actions))
		} catch (e) {
			throw 'unable to parse actions /v1/contract/[contractName]/[methodName]/[args]/[actions]'
		}
	}

    return {
        contract, method, args, actions
    }
}
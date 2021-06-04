

import { decode } from '@msgpack/msgpack';
import { toByteArray } from 'base64-js';

export const pathToArgs = (pathname) => {
	const path = pathname.split('/');

	// console.log('\n\n\npath\n\n\n', path, '\n\n\n')

	// upload or share url path
	if (path[1] === 'v1' && (path[2] === 'upload' || path[2] === 'share')) {
		let args = path[3];
		try {
			args = JSON.parse(decodeURIComponent(args));
		} catch (e) {
			throw 'unable to parse args /v1/upload/[args]';
		}
		return { type: path[2], ...args };
	}

	// redirect path (url args encoded)
	if (path[1] === 'v1' && path[2] === 'r') {
		let decoded = path[3];
		try {
			decoded = decode(toByteArray(decoded));
		} catch (e) {
			throw 'unable to parse args /v1/upload/[args]';
		}
		return { type: 'redirect', ...decoded };
	}

	// encoded path
	if (path[1] === 'v1' && path[2] === 'e') {
		let decoded = path[3];
		try {
			decoded = decode(toByteArray(decoded));
		} catch (e) {
			throw 'unable to decode url';
		}
		return { type: 'view', ...decoded };
	}

	// batch path
	if (path[1] === 'v1' && path[2] === 'batch') {
		let views = path[3];
		try {
			views = JSON.parse(decodeURIComponent(views));
		} catch (e) {
			throw 'unable to parse batch args /v1/batch/[args]';
		}
		return { type: 'batch', views };
	}

	// contract path
	if (path[1] !== 'v1' || path[2] !== 'contract') {
		throw 'supports /v1/contract/[contractName]/[methodName]/[args]/[actions]';
	}
	const contract = path[3];
	if (!contract) throw 'missing /v1/contract/[contractName]';
	const method = path[4];
	if (!method) throw 'missing /v1/contract/[contractName]/[methodName]';

	let args = path[5] || {};
	if (!!args.length) {
		try {
			args = JSON.parse(decodeURIComponent(args));
		} catch (e) {
			throw 'unable to parse args /v1/contract/[contractName]/[methodName]/[args]: ' + args;
		}
	}

	let actions = path[6] || {};
	if (!!actions.length) {
		try {
			actions = JSON.parse(decodeURIComponent(actions));
		} catch (e) {
			throw 'unable to parse actions /v1/contract/[contractName]/[methodName]/[args]/[actions]';
		}
	}

	return {
		type: 'view', contract, method, args, actions
	};
};
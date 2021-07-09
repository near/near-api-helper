
import { uploadB2 } from './b2'
import { encode } from '@msgpack/msgpack';
import { fromByteArray } from 'base64-js';
import {
    nftOwner,
} from './utils';

const DELIMETER = '@'

export const handleUpload = async ({
   url, event, request, networkId, signature, params, jsonHeaders
}) => {
    const {
        nft,
        nft: { contractId, tokenId },
        redirect = FILE_HOST + fn,
        title = '',
        description = '',
    } = params

    nftOwner(networkId, signature, nft)

    const fn = encodeURIComponent(contractId + DELIMETER + tokenId + '.png')
    const body = await request.arrayBuffer()
    const b2upload = uploadB2({
        event,
        fn,
        body,
        bytes: body.byteLength
    })
	event.waitUntil(b2upload);
	const base64 = fromByteArray(encode({ redirect, fn, title, description }));
    // const encodedUrl = 'http://127.0.0.1:8787/v1/r/' + base64;
    const encodedUrl = url.origin + '/v1/r/' + base64;
    return new Response(JSON.stringify({ encodedUrl, fn }), { headers: jsonHeaders });
};

export const handleShare = async ({
    url, params, jsonHeaders
 }) => {
    const {
        nft: { contractId, tokenId },
        redirect,
        title = '',
        description = ''
    } = params
    const fn = encodeURIComponent(contractId + DELIMETER + tokenId + '.png')
	const base64 = fromByteArray(encode({ redirect, fn, title, description }));
    // const encodedUrl = 'http://127.0.0.1:8787/v1/r/' + base64;
    const encodedUrl = url.origin + '/v1/r/' + base64;
    return new Response(JSON.stringify({ encodedUrl, fn }), { headers: jsonHeaders });
};
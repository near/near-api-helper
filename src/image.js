import { 
	account,
	getNestedField
} from './utils';

export const handleImage = async ({
    event, params, corsHeaders
}) => {

    const paramsObj = {}
    for (let [k, v] of params.entries()) {
        paramsObj[k] = v
    }

    console.log('paramsObj', paramsObj)
    const { contract, method, args, path } = paramsObj

    // rpc to get data
    const rpcResponse = await account.viewFunction(contract, method, JSON.parse(args))
    // get image url nested in token data
    const url = getNestedField(rpcResponse, path)
    console.log('url', url)

    // not GA yet

    // const imageRequest = new Request(url, {
    //     headers: corsHeaders,
    // })
    // const imageOptions = {
    //     cf: {
    //         image: {
    //             width, height,
    //             fit: 'cover', gravity: 'auto',
    //             format: 'webp', anim: false,
    //         }
    //     },
    // }
    // console.log('imageOptions', imageOptions)

    // // ref https://developers.cloudflare.com/images/resizing-with-workers
    // const response = await fetch(imageRequest, imageOptions)


    const response = await fetch(url, {
        headers: corsHeaders,
    })

    console.log('response', response)

    if (response.ok) {
        return response
    } else {
        console.log('wut')
        return response
    }
}



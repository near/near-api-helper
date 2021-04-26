const assert = require('assert');
const fetch = require("node-fetch");
// consts
const domain = 'http://127.0.0.1:8787'
// const domain = 'https://helper.nearapi.org/v1/contract/'
const domainAndPath = domain + '/v1/contract/'
const batchPath = domain + '/v1/batch/'

/** 
 * Batch near-api-js RPC calls.
 * 
 * Optionally flatten and sort arrays of objects.
 * 
 * ## 🚨 Warning this is WIP 🚨 
 * - Not officially supported (yet)
 * - Potential syntax changes
 * - For now route does nothing (v1/testnet/view only example)
 * 
 * ## Notes
 * I am aware snake_case and JSON in REST is ugly. However, not willing to convert all method names and args from what you would normally use with near-api-js. e.g. maintain consistency between these API calls and RPC calls as best I can.
 * 
 * ## Syntax
 * ```bash
 * # GET (note with http you need to escape the JSON with single quotes first)
 * http https://helper.nearapi.org/v1/contract/dev-1618440176640-7650905/nft_token/'{"token_id":"token-1619265007329"}'
 * ```
 * 
 * # Example calls from client side:
 */
describe('NEAR API Helper', function () {
    /** 
     * Returns a raw response for a given view near-api-js call (viewFunction)
     */
    it('should have the whole rpc response', async function() {  
        const response = await fetch(domainAndPath + 'dev-1618440176640-7650905/nft_token/{"token_id":"token-1619265007329"}').then((res) => res.json())

        assert.strictEqual(Object.keys(response).length > 1, true)
    });

    /** 
     * Use this to drill into JSON responses (e.g. get metadata for a token)
     */
    it('should return just a field with the last field name as key', async function() {  
        const response = await fetch(domainAndPath + 'dev-1618440176640-7650905/nft_token/{"token_id":"token-1619265007329"}/{"field":"metadata.media"}').then((res) => res.json())

        assert.strictEqual(Object.keys(response).length, 1)
    });

    /** 
     * Creates a bot response for when you share your links (link previews with images etc...)
     */
    it('should have a bot response with customized fields', async function() {  
        const response = await fetch(domainAndPath + 'dev-1618440176640-7650905/nft_token/{"token_id":"token-1619265007329"}/{"botMap":{"og:title":"MEOW","og:image":{"field":"metadata.media"}}}', { 
            headers: {
                'user-agent': 'facebookexternalhit'
            }
        }).then((res) => res.text())

        assert.strictEqual(response.indexOf('MEOW') > -1, true)
    });

    /** 
     * Turn your call into an encoded URL that you can use for sharing (prettier than JSON in REST)
     * 
     * botMap for bots -> link preview
     * redirect for users -> NFT item
     */
     it('should return an encoded url', async function() {  
        const response = await fetch(domainAndPath + 'dev-1618440176640-7650905/nft_token/{"token_id":"token-1619265007329"}/{"botMap":{"og:image":{"field":"metadata.media"}},"redirect":"https%3A%2F%2Fnear-apps.github.io%2Fnft-market%2F","encodeUrl":true}').then((res) => res.json())
        
        assert.strictEqual(Object.keys(response)[0], 'encodedUrl')
    });

    /** 
     * Use this to get a lot of data at once.
     * 
     * Call different view methods.
     * 
     * Within each call, the first and second arguments of batch must have names matching the contract arguments used for offset and limit.
     * 
     * e.g. if the contract has args like "offset" and "num", you need to use: batch: { offset: '0', num: '100', step: '10' }
     * 
     * This means "start at '0' and keep making RPC calls until '100' increasing by '10' each time." creating a total of 10 RPC calls in the helper, but only 1 call and reponse for the user.
     * 
     * flatten: [] combines results into an array vs. separate RPC results
     * 
     * WIP
     * sort.field: what field on the objects to use for sorting
     * sort.parse: how to treat the field "int": parseInt or "bn": parseFloat(parseNearAmount(val, 8)) // 8 decimal approximation of NEAR
     */
    it('should return a batched response', async function() {
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
    });
});
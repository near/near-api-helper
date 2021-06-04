
const nearAPI = require('near-api-js');
const getConfig = require('./config');
const { nodeUrl, networkId } = getConfig();
const {
    keyStores: { InMemoryKeyStore },
	Near, Account, KeyPair,
} = nearAPI;

const accountId = 'dev-1622483586098-7037602'
const credentials = {
	"account_id": accountId,
	"public_key":"ed25519:E3tFXaYxHMmPK1uk5EtZSnNGCKkV14d5Ee28UyjWgBZi",
	"private_key":"ed25519:5q4cW6QLqU1t257yzipYjMT5UvECdFrpzG1sgPHEiRqNY6rnsG1dPGMPzvdeQyccjTzJ4dvJWUk8hn7NSY2qkHag"
}
const keyStore = new InMemoryKeyStore()
keyStore.setKey(networkId, accountId, KeyPair.fromString(credentials.private_key));
const near = new Near({
	networkId, nodeUrl,
	deps: { keyStore },
});
const { connection } = near;
const account = new Account(connection, accountId);
account.contractId = accountId
account.tokenId = 'regl-1-1622483600037:0'

const getSignature = async (account) => {
	const { accountId } = account;
	const block = await account.connection.provider.block({ finality: 'final' });
	const blockNumber = block.header.height.toString();
	const signer = account.inMemorySigner || account.connection.signer;
	const signed = await signer.signMessage(Buffer.from(blockNumber), accountId, networkId);
	const blockNumberSignature = Buffer.from(signed.signature).toString('base64');
	return { accountId, blockNumber, blockNumberSignature };
};

module.exports = {
	near,
	keyStore,
	connection,
	account,
    getSignature,
};
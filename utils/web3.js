const ganache = require('ganache-cli');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');

module.exports = () => {
  let web3;

  if (process.env.NODE_ENV === 'test') {
    web3 = new Web3(ganache.provider({ default_balance_ether: 1000 }));
    return web3;
  } else if (process.env.NODE_ENV === 'development') {
    // First component is the mnemonic address
    // Second component is link of network we wanna connect to, in this case the Ropsten Test Network, link provided by Infura to ease our effort in setting up our own Ethereum node. The link allows us to connect to a node offered by Infura
    const provider = new HDWalletProvider({
      mnemonic: { phrase: process.env.MNEMONIC },
      providerOrUrl: process.env.INFURA_URL,
    });

    web3 = new Web3(provider);
    return { web3, provider };
  }
};

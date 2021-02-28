const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const dotenv = require('dotenv');
const path = require('path');

const configPath = path.resolve(__dirname, 'config', 'config.env');
dotenv.config({ path: configPath });

const { interface, bytecode } = require('./compile')(process.env.CONTRACT);

// First component is the mnemonic address
// Second component is link of network we wanna connect to, in this case the Ropsten Test Network, link provided by Infura to ease our effort in setting up our own Ethereum node. The link allows us to connect to a node offered by Infura
const provider = new HDWalletProvider({
  mnemonic: { phrase: process.env.MNEMONIC },
  providerOrUrl: process.env.INFURA_URL,
});

const web3 = new Web3(provider);

(async () => {
  // Mnemonic phrases involve a large number of accounts => we only use the first one for development purpose
  const accounts = await web3.eth.getAccounts();

  console.log('Attempting to deploy from account', accounts[0]);
  const contract = new web3.eth.Contract(JSON.parse(interface));
  let result;

  if (process.env.CONTRACT === 'Rps') {
    result = await contract.deploy({ data: bytecode }).send({ gas: '1000000', from: accounts[0] });
  }

  // ABI for React to use
  console.log(interface);
  // The address of block that the contract is deployed to. For react use
  console.log('Contract deployed to', result.options.address);
  provider.engine.stop();
})();

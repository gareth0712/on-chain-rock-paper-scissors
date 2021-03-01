const dotenv = require('dotenv');
const path = require('path');

const configPath = path.resolve(__dirname, 'config', 'config.env');
dotenv.config({ path: configPath });

const { interface, bytecode } = require('./compile')(process.env.CONTRACT);
const { web3, provider } = require('./utils/web3')();

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

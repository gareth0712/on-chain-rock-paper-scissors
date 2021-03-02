import web3 from './web3';

let address, abi;

if (process.env.REACT_APP_ENV === 'RpsAdvanced') {
  address = process.env.REACT_APP_ADVANCED_BLOCK_ADDRESS;
  abi = JSON.parse(process.env.REACT_APP_ADVANCED_ABI);
} else if (process.env.REACT_APP_ENV === 'RpsAdvancedTest') {
  address = process.env.REACT_APP_ADVANCED_TEST_BLOCK_ADDRESS;
  abi = JSON.parse(process.env.REACT_APP_ADVANCED_TEST_ABI);
}
// Level 1 contract Won't work since the updated components in React requires components from level2 contract (e.g. fomo variables)
// else if (process.env.REACT_APP_ENV === 'Rps') {
//   address = process.env.REACT_APP_BLOCK_ADDRESS;
//   abi = JSON.parse(process.env.REACT_APP_ABI);
// }

// The purpose of this file is to create a local instance of the contract.
// We're going to make an object that exists only inside of our browser.
// It functions as an abstraction of our deployed contract on the blockchain and represents what is actually occurring on the block.
export default new web3.eth.Contract(abi, address);

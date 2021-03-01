import web3 from './web3';

const address = process.env.REACT_APP_BLOCK_ADDRESS;
const abi = JSON.parse(process.env.REACT_APP_ABI);

// The purpose of this file is to create a local instance of the contract.
// We're going to make an object that exists only inside of our browser.
// It functions as an abstraction of our deployed contract on the blockchain and represents what is actually occurring on the block.
export default new web3.eth.Contract(abi, address);

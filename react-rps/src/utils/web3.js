import Web3 from 'web3';

let web3;

// the window.ethereum object itself is a provider type that supports the methods defined in EIP-1102 and EIP-1193.
// No more having to check window.web3 for its currentProvider — we can simply use window.ethereum as the provider itself!
if (window.ethereum) {
  web3 = new Web3(window.ethereum);
  window.ethereum.enable();
}

export default web3;

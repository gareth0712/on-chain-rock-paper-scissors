module.exports = (web3) => {
  return [web3.utils.keccak256('rock'), web3.utils.keccak256('paper'), web3.utils.keccak256('scissors')];
};

module.exports = (web3) => {
  return async (accounts, rps) => {
    const playerBalance = Number(await web3.eth.getBalance(accounts[1]));
    const contractBalance = Number(await web3.eth.getBalance(rps.options.address));
    return [playerBalance, contractBalance];
  };
};

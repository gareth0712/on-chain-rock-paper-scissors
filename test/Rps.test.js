const assert = require('assert');

process.env.NODE_ENV = 'test';

const web3 = require('../utils/web3')();
// Utils
const randomNumber = require('../utils/randomNumber');
const actions = require('../utils/actions')(web3);
const getBalances = require('../utils/getBalances')(web3);
// Local copy of contract for testing
const { interface, bytecode } = require('../compile')('Rps');

let rps;
let accounts;

// Helper functions purely for testing
const deployContract = async () => {
  // Place a contract with accounts[0], so only accounts[0] can use restricted functions
  // like hostPlaceBankroll() and collectFromBalance
  return await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '3000000' });
};

const placeBet = async (amount = '10', unit = 'finney', betAccount = accounts[1]) => {
  return await rps.methods.playerPlaceBet(actions[0], randomNumber()).send({
    from: betAccount,
    value: web3.utils.toWei(amount, unit),
    gas: 3000000,
  });
};

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  rps = await deployContract();
  await rps.methods.hostPlaceBankroll().send({
    from: accounts[0],
    value: web3.utils.toWei('1', 'ether'),
  });
});

describe('Helper functions and basic functions tests', () => {
  it('Deploys a contract', () => {
    assert.ok(rps.options.address);
  });

  it("host variable is contract creator's address", async () => {
    const hostAddress = await rps.methods.host().call();
    assert.strictEqual(hostAddress, accounts[0]);
  });

  it('hostLastAction variable is empty before any game', async () => {
    const hostLastAction = await rps.methods.hostLastAction().call();
    assert.strictEqual(web3.utils.hexToString(hostLastAction), '');
  });

  it('lastWinner variable is empty before any game', async () => {
    const lastWinner = await rps.methods.lastWinner().call();
    assert.strictEqual(web3.utils.hexToString(lastWinner), '');
  });

  it('Host increase the bankroll', async () => {
    await rps.methods.hostPlaceBankroll().send({
      from: accounts[0],
      value: web3.utils.toWei('1', 'ether'),
    });

    const contractBalance = await web3.eth.getBalance(rps.options.address);
    assert.strictEqual(contractBalance, web3.utils.toWei('2', 'ether'));
  });

  it('Player is not authorized to increase the bankroll', async () => {
    try {
      // Only contracter creator, i.e. accounts[0], can call this method
      await rps.methods.hostPlaceBankroll().send({
        from: accounts[1],
        value: web3.utils.toWei('100', 'gwei'),
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('Host collect the contract balance', async () => {
    const hostInitialBalance = await web3.eth.getBalance(accounts[0]);
    await rps.methods.collectFromBalance(web3.utils.toWei('1', 'ether')).send({
      from: accounts[0],
    });

    const contractBalance = await web3.eth.getBalance(rps.options.address);
    assert.strictEqual(contractBalance, '0');
    const hostCurrentBalance = await web3.eth.getBalance(accounts[0]);
    // Not exactly 1 eth since there gas price deducted the balance during the transaction
    assert(hostCurrentBalance - hostInitialBalance >= web3.utils.toWei('0.999', 'ether'));
  });

  it('Host cannot collect more than the contract balance', async () => {
    try {
      await rps.methods.collectFromBalance(web3.utils.toWei('10', 'ether')).send({
        from: accounts[0],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('player is not authorized to collect the contract balance', async () => {
    try {
      // Only contracter creator, i.e. accounts[0], can call this method
      await rps.methods.collectFromBalance(web3.utils.toWei('5', 'ether')).send({
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
});

describe('Rps game tests', () => {
  it('Host is able to make RPS action', async () => {
    const hostAction = await rps.methods.getHostAction(randomNumber()).call();
    assert(actions.includes(hostAction));
  });

  it('Player cannot play the game if he does not let host knows his action', async () => {
    try {
      await rps.methods.playerPlaceBet(randomNumber(), randomNumber()).send({
        from: accounts[1],
        value: web3.utils.toWei('1', 'gwei'),
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('Player cannot play the game if he provides invalid action', async () => {
    try {
      await rps.methods.playerPlaceBet(web3.utils.keccak256('abc'), randomNumber()).send({
        from: accounts[1],
        value: web3.utils.toWei('1', 'gwei'),
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('Player cannot play the game without placing a positive bet', async () => {
    try {
      await rps.methods.playerPlaceBet(actions[0], randomNumber()).send({
        from: accounts[1],
        value: 0,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('Player cannot play the game if his bet is fewer than 1 gwei', async () => {
    try {
      await rps.methods.playerPlaceBet(actions[0], randomNumber()).send({
        from: accounts[1],
        value: 1000,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  // The contract is not able to pay the player if the bet is more than the bankroll
  it('Player cannot play the game if his bet is more the bankroll', async () => {
    try {
      await rps.methods.playerPlaceBet(actions[0], randomNumber()).send({
        from: accounts[1],
        value: web3.utils.toWei('1.1', 'ether'),
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('When player wins the game', async () => {
    let win = false;
    let winner;
    while (win === false) {
      const [initPlayerBalance, initContractBalance] = await getBalances(accounts, rps);
      await placeBet('10', 'finney');

      winner = await rps.methods.lastWinner().call();
      if (winner !== accounts[1]) {
        continue;
      }

      const [currentPlayerBalance, currentContractBalance] = await getBalances(accounts, rps);
      const playerBalanceDifference = currentPlayerBalance - initPlayerBalance;
      const contractBalanceDifference = currentContractBalance - initContractBalance;

      console.log('player bal diff', playerBalanceDifference);
      console.log('contract bal diff', contractBalanceDifference);

      assert(contractBalanceDifference === Number(web3.utils.toWei('-10', 'finney')));
      // Gas makes the gain slightly less than 10 finney
      assert(playerBalanceDifference >= Number(web3.utils.toWei('9.8', 'finney')));
      hostLastAction = await rps.methods.hostLastAction().call();
      assert(hostLastAction === actions[2]);
      win = true;
    }
    assert(winner === accounts[1]);
  }).timeout(20000);

  it('When player loses the game', async () => {
    let lose = false;
    let winner;
    while (lose === false) {
      const [initPlayerBalance, initContractBalance] = await getBalances(accounts, rps);
      await placeBet('10', 'finney');

      winner = await rps.methods.lastWinner().call();
      if (winner !== accounts[0]) {
        continue;
      }

      const [currentPlayerBalance, currentContractBalance] = await getBalances(accounts, rps);
      const playerBalanceDifference = currentPlayerBalance - initPlayerBalance;
      const contractBalanceDifference = currentContractBalance - initContractBalance;

      console.log('player bal diff', playerBalanceDifference);
      console.log('contract bal diff', contractBalanceDifference);

      assert(contractBalanceDifference === Number(web3.utils.toWei('10', 'finney')));
      // Gas makes the loss slightly more than 10 finney
      assert(playerBalanceDifference >= web3.utils.toWei('-10.5', 'finney'));
      hostLastAction = await rps.methods.hostLastAction().call();
      assert(hostLastAction === actions[1]);
      lose = true;
    }
    assert(winner === accounts[0]);
  }).timeout(20000);

  it('Draw', async () => {
    let draw = false;
    let winner;
    while (draw === false) {
      const [initPlayerBalance, initContractBalance] = await getBalances(accounts, rps);
      await placeBet('10', 'finney');

      winner = await rps.methods.lastWinner().call();
      if (winner !== '0x0000000000000000000000000000000000000000') {
        continue;
      }

      const [currentPlayerBalance, currentContractBalance] = await getBalances(accounts, rps);
      const playerBalanceDifference = currentPlayerBalance - initPlayerBalance;
      const contractBalanceDifference = currentContractBalance - initContractBalance;

      console.log('player bal diff', playerBalanceDifference);
      console.log('contract bal diff', contractBalanceDifference);

      assert(contractBalanceDifference === 0);
      // Gas makes the loss slightly more than 10 finney
      assert(playerBalanceDifference >= web3.utils.toWei('-0.5', 'finney'));
      hostLastAction = await rps.methods.hostLastAction().call();
      assert(hostLastAction === actions[0]);
      draw = true;
    }
    assert(winner === '0x0000000000000000000000000000000000000000');
  }).timeout(20000);
});

const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile')('Rps');

let rps;
let accounts;
const actions = [web3.utils.keccak256('rock'), web3.utils.keccak256('paper'), web3.utils.keccak256('scissors')];

// Helper functions
const deployContract = async () => {
  // Place a contract with accounts[0], so only accounts[0] can use restricted functions
  // like hostPlaceBankroll() and collectFromBalance
  return await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '3000000' });
};

const placeBeginningBankroll = async (unit = 'ether') => {
  return await rps.methods.hostPlaceBankroll().send({
    from: accounts[0],
    value: web3.utils.toWei('1', unit),
  });
};

const getBalances = async () => {
  const playerBalance = Number(await web3.eth.getBalance(accounts[1]));
  const contractBalance = Number(await web3.eth.getBalance(rps.options.address));
  return [playerBalance, contractBalance];
};

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  rps = await deployContract();
  await placeBeginningBankroll();
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
    const hostAction = await rps.methods.getHostAction().call();
    assert(actions.includes(hostAction));
  });

  it('Player cannot play the game if he does not let host knows his action', async () => {
    try {
      await rps.methods.playerPlaceBet().send({
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
      await rps.methods.playerPlaceBet(web3.utils.keccak256('abc')).send({
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
      await rps.methods.playerPlaceBet(actions[0]).send({
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
      await rps.methods.playerPlaceBet(actions[0]).send({
        from: accounts[1],
        value: 1000,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  // player could get 2 times of his bet if he wins
  // So if the bet is more than half of the bankroll, there is not sufficient amount in the bankroll
  // to pay to the player that won the rps game
  it('Player cannot play the game if his bet is more than half of the bankroll', async () => {
    try {
      await rps.methods.playerPlaceBet(actions[0]).send({
        from: accounts[1],
        value: web3.utils.toWei('0.6', 'ether'),
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
      // Get init balance before sending transaction
      const [initPlayerBalance, initContractBalance] = await getBalances();

      // 10 finney = 0.01 ether
      await rps.methods.playerPlaceBet(actions[0]).send({
        from: accounts[1],
        value: web3.utils.toWei('10', 'finney'),
        gas: 3000000,
      });

      // Get winner
      winner = await rps.methods.lastWinner().call();

      if (winner !== accounts[1]) {
        continue;
      }

      const [currentPlayerBalance, currentContractBalance] = await getBalances();
      const playerBalanceDifference = currentPlayerBalance - initPlayerBalance;
      const contractBalanceDifference = currentContractBalance - initContractBalance;

      console.log('player bal diff', playerBalanceDifference);
      console.log('contract bal diff', contractBalanceDifference);
      // Get host last action
      hostLastAction = await rps.methods.hostLastAction().call();
      // check balance
      assert(contractBalanceDifference === Number(web3.utils.toWei('-10', 'finney')));
      // Gas makes the gain slightly less than 10 finney
      assert(playerBalanceDifference >= Number(web3.utils.toWei('9.8', 'finney')));
      // Check host action
      assert(hostLastAction === actions[2]);
      win = true;
    }
    assert(winner === accounts[1]);
  }).timeout(20000);

  it('When player loses the game', async () => {
    let lose = false;
    let winner;
    while (lose === false) {
      // Get init balance before sending transaction
      const [initPlayerBalance, initContractBalance] = await getBalances();

      // 10 finney = 0.01 ether
      await rps.methods.playerPlaceBet(actions[0]).send({
        from: accounts[1],
        value: web3.utils.toWei('10', 'finney'),
        gas: 3000000,
      });

      // Get winner
      winner = await rps.methods.lastWinner().call();

      if (winner !== accounts[0]) {
        continue;
      }

      const [currentPlayerBalance, currentContractBalance] = await getBalances();
      const playerBalanceDifference = currentPlayerBalance - initPlayerBalance;
      const contractBalanceDifference = currentContractBalance - initContractBalance;

      console.log('player bal diff', playerBalanceDifference);
      console.log('contract bal diff', contractBalanceDifference);
      // Get host last action
      hostLastAction = await rps.methods.hostLastAction().call();
      // check balance
      assert(contractBalanceDifference === Number(web3.utils.toWei('10', 'finney')));
      // Gas makes the loss slightly more than 10 finney
      assert(playerBalanceDifference >= web3.utils.toWei('-10.5', 'finney'));
      // Check host action
      assert(hostLastAction === actions[1]);
      lose = true;
    }
    assert(winner === accounts[0]);
  }).timeout(20000);

  it('Draw', async () => {
    let draw = false;
    let winner;
    while (draw === false) {
      // Get init balance before sending transaction
      const [initPlayerBalance, initContractBalance] = await getBalances();

      // 10 finney = 0.01 ether
      await rps.methods.playerPlaceBet(actions[0]).send({
        from: accounts[1],
        value: web3.utils.toWei('10', 'finney'),
        gas: 3000000,
      });

      // Get winner
      winner = await rps.methods.lastWinner().call();

      if (winner !== '0x0000000000000000000000000000000000000000') {
        continue;
      }

      const [currentPlayerBalance, currentContractBalance] = await getBalances();
      const playerBalanceDifference = currentPlayerBalance - initPlayerBalance;
      const contractBalanceDifference = currentContractBalance - initContractBalance;

      console.log('player bal diff', playerBalanceDifference);
      console.log('contract bal diff', contractBalanceDifference);
      // Get host last action
      hostLastAction = await rps.methods.hostLastAction().call();
      // check balance
      assert(contractBalanceDifference === 0);
      // Gas makes the loss slightly more than 10 finney
      assert(playerBalanceDifference >= web3.utils.toWei('-0.5', 'finney'));
      // Check host action
      assert(hostLastAction === actions[0]);
      draw = true;
    }
    assert(winner === '0x0000000000000000000000000000000000000000');
  }).timeout(20000);
});

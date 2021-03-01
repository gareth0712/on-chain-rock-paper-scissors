const assert = require('assert');

process.env.NODE_ENV = 'test';

const web3 = require('../utils/web3')();
// Utils
const randomNumber = require('../utils/randomNumber');
const actions = require('../utils/actions')(web3);
const getBalances = require('../utils/getBalances')(web3);
const getCurrentTime = require('../utils/getCurrentTime');
const sleep = require('../utils/sleep');
// Local copy of contract for testing
const { interface: rpsAdvancedInterface, bytecode: rpsAdvancedBytecode } = require('../compile')('RpsAdvanced');
// RpsAdvancedTest.sol is a copy of RpsAdvanced.sol but the fomoEndTime is amended to increase 5 seconds upon the fomo timer being started
// It is created solely for "fomo timer goest to zero" tests
const { interface: rpsAdvancedTestInterface, bytecode: rpsAdvancedTestBytecode } = require('../compile')(
  'RpsAdvancedTest'
);

let rps, accounts, fomoTimerGoesToZeroTest;

// Helper functions purely for testing
const deployContract = async (interface, bytecode) => {
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

const winAGame = async (account = accounts[1], amount = '10', unit = 'finney') => {
  let win = false;
  let winner;
  while (win === false) {
    await placeBet(amount, unit);

    winner = await rps.methods.lastWinner().call();
    if (winner !== account) {
      continue;
    }

    // Make sure owner is the account we want
    const fomoOwner = await rps.methods.fomoOwner().call();
    assert(fomoOwner === account);

    win = true;
  }
};

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  if (!fomoTimerGoesToZeroTest) {
    rps = await deployContract(rpsAdvancedInterface, rpsAdvancedBytecode);
  } else {
    rps = await deployContract(rpsAdvancedTestInterface, rpsAdvancedTestBytecode);
  }
  await rps.methods.hostPlaceBankroll().send({
    from: accounts[0],
    value: web3.utils.toWei('1', 'ether'),
  });
});

describe('Helper functions and basic functions tests - Level 2', () => {
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

  it('Fomo pool is off by default', async () => {
    const fomoTimerOn = await rps.methods.fomoTimerOn().call();
    assert.strictEqual(fomoTimerOn, false);
  });

  it('Fomo pool balance is 0 by default', async () => {
    const fomoBalance = await rps.methods.fomoBalance().call();
    assert.strictEqual(fomoBalance, '0');
  });

  it('Fomo owner is no one by default', async () => {
    const fomoOwner = await rps.methods.fomoOwner().call();
    assert.strictEqual(web3.utils.hexToString(fomoOwner), '');
  });

  it('Fomo start time 0 by default', async () => {
    const fomoTime = await rps.methods.fomoEndTime().call();
    assert.strictEqual(fomoTime, '0');
  });

  it('Cannot release fomo when no one owns it', async () => {
    try {
      await rps.methods.releaseFomo().send({
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
});

describe('Rps game tests - Level 2', () => {
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
  it('Player cannot play the game if his bet is more than the bankroll balance', async () => {
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

  it('When player wins the game, he gets 95% of the rewards', async () => {
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

      // First contract balance +10 when player places a bet
      // Then contract  balance -20 * 0.95 when player wins, 20 * 0.05 stays as fomo pool
      // +10 - 20 * 0.95 = -9
      assert(contractBalanceDifference === Number(web3.utils.toWei('-9', 'finney')));
      // First player balance -10 when he places a bet
      // Then player balance +20 * 0.95 when he wins
      // -10 + 20 * 0.95 = 9
      // Gas makes the gain slightly less than 9 finney
      assert(playerBalanceDifference >= Number(web3.utils.toWei('8.7', 'finney')));
      // Fomo balance is 1
      const fomoBalance = await rps.methods.fomoBalance().call();
      assert.strictEqual(fomoBalance, web3.utils.toWei('1', 'finney'));

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

describe('Fomo Pool tests - Level 2', () => {
  it('Turn on the timer by placing a bet and set timer to 1hour later', async () => {
    await placeBet('10', 'finney', accounts[1]);
    const fomoTimerOn = await rps.methods.fomoTimerOn().call();
    assert(fomoTimerOn);
    const fomoEndTime = await rps.methods.fomoEndTime().call();
    const currentTime = getCurrentTime();
    // Allow buffer of 2 seconds
    assert(fomoEndTime - currentTime >= 3598);
    const fomoOwner = await rps.methods.fomoOwner().call();
    assert(fomoOwner === accounts[1]);
  });

  // Similar test case to the win test case above, but this case has more focus on fomo
  it('If player wins, 5% of rewards go to fomo pool', async () => {
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

      assert(contractBalanceDifference === Number(web3.utils.toWei('-9', 'finney')));
      // Gas makes the gain slightly less than 9 finney
      assert(playerBalanceDifference >= Number(web3.utils.toWei('8.7', 'finney')));

      // Checking for all fomo variables
      const fomoBalance = await rps.methods.fomoBalance().call();
      assert.strictEqual(fomoBalance, web3.utils.toWei('1', 'finney'));
      const fomoTimerOn = await rps.methods.fomoTimerOn().call();
      assert(fomoTimerOn);
      const fomoEndTime = await rps.methods.fomoEndTime().call();
      const currentTime = getCurrentTime();
      assert(fomoEndTime - currentTime >= 3598);
      const fomoOwner = await rps.methods.fomoOwner().call();
      assert(fomoOwner === accounts[1]);

      hostLastAction = await rps.methods.hostLastAction().call();
      assert(hostLastAction === actions[2]);
      win = true;
    }
    assert(winner === accounts[1]);
  }).timeout(20000);

  it('Extend the timer by placing another bet that is at least 10% of the pool size', async () => {
    await winAGame(accounts[1]);

    // 0.1 finney >= 10% of fomo pool (1 finney * 10% )
    await placeBet('0.1', 'finney', accounts[1]);

    // Focus of this test
    const newFomoEndTime = await rps.methods.fomoEndTime().call();
    const currentTime = getCurrentTime();
    assert(newFomoEndTime - currentTime >= 3598);
    // Make sure other variables are as expected
    const fomoTimerOn = await rps.methods.fomoTimerOn().call();
    assert(fomoTimerOn);
    const fomoOwner = await rps.methods.fomoOwner().call();
    assert(fomoOwner === accounts[1]);
  }).timeout(20000);

  it('Update fomo owner if another player places a bet that is at least 10% of the pool size', async () => {
    await winAGame(accounts[1]);

    // 0.1 finney >= 10% of fomo pool (1 finney * 10% )
    await placeBet('0.1', 'finney', accounts[2]);

    // Focus of this test
    const newFomoOwner = await rps.methods.fomoOwner().call();
    assert(newFomoOwner === accounts[2]);
    const newFomoEndTime = await rps.methods.fomoEndTime().call();
    const currentTime = getCurrentTime();
    assert(newFomoEndTime - currentTime >= 3598);
    // Make sure other variables are as expected
    const fomoTimerOn = await rps.methods.fomoTimerOn().call();
    assert(fomoTimerOn);
  }).timeout(20000);

  it('Not extend the fomo pool nor update fomo owner if another player place a bet that is less than 10% of the pool size', async () => {
    await winAGame(accounts[1]);
    const fomoEndTimeWhenPlayer1Wins = await rps.methods.fomoEndTime().call();

    // 0.09 finney < 10% of fomo pool (1 finney * 10% )
    await placeBet('0.09', 'finney', accounts[2]);

    // Focus of this test
    const newFomoOwner = await rps.methods.fomoOwner().call();
    assert(newFomoOwner === accounts[1]);
    const newFomoEndTime = await rps.methods.fomoEndTime().call();
    assert(fomoEndTimeWhenPlayer1Wins === newFomoEndTime);
    // Make sure other variables are as expected
    const fomoTimerOn = await rps.methods.fomoTimerOn().call();
    assert(fomoTimerOn);
  }).timeout(20000);

  it('Cannot withdraw bankroll that is part of fomo pool', async () => {
    await winAGame(accounts[1]);
    const contractBalance = await web3.eth.getBalance(rps.options.address);
    try {
      await rps.methods.collectFromBalance(contractBalance).send({
        from: accounts[0],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  }).timeout(20000);

  it('When fomo pool balance is positive, cannot place a bet that is larger than the amount of contract balance minus fomo pool balance', async () => {
    // Before game, balance of contract 1 eth
    await winAGame(accounts[1], '0.1', 'ether');
    // After the game, balance of contract 0.9 eth + fomo pool 0.01 eth
    const contractBalance = await web3.eth.getBalance(rps.options.address);
    try {
      await placeBet('0.91', 'ether');
      assert(false);
    } catch (err) {
      assert(err);
    }
  }).timeout(20000);

  it('Switch to RpsAdvancedTest.sol for testing Fomo timer goes to zero tests', () => {
    // Using conditional in beforeEach to apply another contract for fomo-timer-goes-to-zero tests
    fomoTimerGoesToZeroTest = true;
    assert(true);
  });
});

describe('Fomo timer goes to zero tests - Level 2', () => {
  it('Fomo timer goes to zero', async () => {
    // 1. Win a game with 10 finney
    await winAGame(accounts[1]);

    const [initPlayerBalance, initContractBalance] = await getBalances(accounts, rps);
    const fomoBalanceBefore = await rps.methods.fomoBalance().call();
    assert(fomoBalanceBefore === web3.utils.toWei('1', 'finney'));

    // 2. Wait for 5 seconds (In RpsAdvanced.sol, it is one hour; For this test suite we use RpsAdvancedTest.sol just for testing things after fomo timer goes to zero)
    await sleep(5000);

    // 3. Send the release fomo function
    await rps.methods.releaseFomo().send({ from: accounts[1] });

    // 4. Verify balance
    const [currentPlayerBalance, currentContractBalance] = await getBalances(accounts, rps);
    // gas deducted the fomo released to player
    assert(currentPlayerBalance - initPlayerBalance >= Number(web3.utils.toWei('0.94', 'finney')));
    assert(currentContractBalance - initContractBalance === Number(web3.utils.toWei('-1', 'finney')));

    // 5. Verify if all the fomo variables returns to beginning state
    const fomoBalanceAfter = await rps.methods.fomoBalance().call();
    assert(fomoBalanceAfter === '0');
    const fomoTimerOn = await rps.methods.fomoTimerOn().call();
    assert(!fomoTimerOn);
    const fomoOwner = await rps.methods.fomoOwner().call();
    assert.strictEqual(web3.utils.hexToString(fomoOwner), '');
    const fomoEndTime = await rps.methods.fomoEndTime().call();
    assert(fomoEndTime === '0');
  }).timeout(30000);
});

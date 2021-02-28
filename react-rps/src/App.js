import React, { useState, useEffect } from 'react';
import web3 from './web3';
import './App.css';
import rps from './rps';
import actions from './utils/actions';

const App = () => {
  // Player-related
  const [betInput, setBetInput] = useState(''); // String Since the input of user is always String
  const [playerAction, setPlayerAction] = useState('');
  // Host-related
  const [bankroll, setBankroll] = useState(''); // String since web3.eth.getBalance returns string
  const [bankrollInput, setBankrollInput] = useState('');
  const [withdrawalInput, setWithdrawalInput] = useState('');
  // Application-related
  const [host, setHost] = useState('');
  const [player, setPlayer] = useState('');
  const [playerBalance, setPlayerBalance] = useState('');
  const [message, setMessage] = useState('');
  const [hostAction, setHostAction] = useState('');

  const onPlayerSubmit = async (event) => {
    // We do not want the event submit works like the traditional html way
    event.preventDefault();
    const betInWei = web3.utils.toWei(betInput, 'gwei');
    if (playerAction !== '' && betInput !== '' && betInWei > 0 && betInWei * 2 <= bankroll) {
      setMessage('Pending transaction to be completed...');
      await rps.methods.playerPlaceBet(web3.utils.keccak256(playerAction)).send({
        from: player,
        value: betInWei,
      });

      const winner = await rps.methods.lastWinner().call();
      const hostLastAction = actions[await rps.methods.hostLastAction().call()];
      if (winner === host) {
        setMessage(`Host's action is ${hostLastAction}. Sorry, you lost the game. But you will win again!`);
      } else if (winner === player) {
        setMessage(
          `Host's action is ${hostLastAction}. Congratulations, you won the game and you got ${betInput * 2} Gwei!`
        );
      } else {
        setMessage(`Host's action is ${hostLastAction}. Draw game!`);
      }
    } else {
      setMessage(
        'Bet amount of at least 1 Gwei and at most half of the bankroll will be accepted and please ensure you have selected an action in order to play the game!'
      );
    }
  };

  const onHostSubmitBankroll = async (event) => {
    event.preventDefault();
    if (player === host && bankrollInput !== '' && bankrollInput > 0) {
      setMessage('Pending transaction to be completed...');

      await rps.methods.hostPlaceBankroll().send({
        from: host,
        value: web3.utils.toWei(bankrollInput, 'gwei'),
      });

      setMessage(`You have successfully added ${bankrollInput} Gwei to the bankroll!`);
    } else {
      setMessage(
        'Only host can perform this operation and please ensure you have entered a positive bankroll in Gwei!'
      );
    }
  };

  const onHostSubmitWitdrawal = async (event) => {
    event.preventDefault();
    if (player === host && withdrawalInput !== '' && withdrawalInput > 0) {
      setMessage('Pending transaction to be completed...');
      const withdrawalInWei = await web3.utils.toWei(withdrawalInput, 'gwei');
      await rps.methods.collectFromBalance(withdrawalInWei).send({ from: host });

      setMessage(`You have successfully collected ${withdrawalInput} Gwei from the bankroll back to your wallet!`);
    } else {
      setMessage(
        'Only host can perform this operation and please ensure you have entered a positive bankroll in Gwei!'
      );
    }
  };

  const onVerify = async () => {
    const message = `Host's action is:`;
    const theHostAction = await rps.methods.getHostAction().call();
    setHostAction(`${message} ${actions[theHostAction]}`);
  };

  const getStates = async () => {
    setHost(await rps.methods.host().call());
    setBankroll(await web3.eth.getBalance(rps.options.address));

    const thePlayer = await web3.eth.getAccounts();
    if (thePlayer[0] !== '') {
      const signedPlayerAddress = await web3.utils.toChecksumAddress(thePlayer[0]);
      setPlayer(signedPlayerAddress);
      setPlayerBalance(await web3.eth.getBalance(signedPlayerAddress));
    }
  };

  useEffect(() => {
    getStates();
  });

  return (
    <div>
      <h2>Rock Paper Scissors Game</h2>
      <p>This contract is hosted by {host}.</p>
      {bankroll === '0' ? (
        <p>No bankroll is available at the moment. Please wait until host deposit some bankroll to start the game.</p>
      ) : (
        <p>The current available bankroll for players to win is {web3.utils.fromWei(bankroll, 'gwei')} Gwei!</p>
      )}
      <hr />
      <form onSubmit={onPlayerSubmit}>
        <h4>Want to try your luck?</h4>
        <p>Your Address: {player}</p>
        <p>Your Balance: {playerBalance} Gwei</p>
        <div>
          <label>Amount of Gwei to place a bet </label>
          <input value={betInput} onChange={(event) => setBetInput(event.target.value.replace(/\D/, ''))} />
          <select value={playerAction} onChange={(event) => setPlayerAction(event.target.value)}>
            <option value="" selected={true}>
              Select
            </option>
            <option value="rock">Rock</option>
            <option value="paper">Paper</option>
            <option value="scissors">Scissors</option>
          </select>
        </div>
        <button disabled={bankroll === '0'}>Enter</button>
      </form>
      <hr />
      <div>
        <h2>Verify the Game</h2>
        <p>
          This game is provably fair. It means that you can verify that the host did not have any advantage over her in
          any game she play.
        </p>
        <p>
          It is true that the function of getting host's action in the Rock Paper Scissors game is not completely random
          but it is dependent on the certain variable factors. The host believes that it is difficult enough for her to
          manipulate the result as the factors does not have anything to do with player's action.
        </p>
        <p>
          The function of getting host's action is always available for players to verify. Click the verify button below
          to see what action the host will place.
        </p>
        <button onClick={onVerify}>Verify</button>
        <h4>{hostAction}</h4>
      </div>
      <hr />
      <div>
        <h2>Host-only Operations</h2>
        <form onSubmit={onHostSubmitBankroll}>
          <h4>Add bankroll</h4>
          <div>
            <label>Amount to add to bankroll </label>
            <input value={bankrollInput} onChange={(event) => setBankrollInput(event.target.value.replace(/\D/, ''))} />
            <label> Gwei</label>
          </div>
          <button disabled={host !== player}>Add Bankroll</button>
        </form>
        <form onSubmit={onHostSubmitWitdrawal}>
          <h4>Collect bankroll</h4>
          <div>
            <label>Amount to collect from bankroll </label>
            <input
              value={withdrawalInput}
              onChange={(event) => setWithdrawalInput(event.target.value.replace(/\D/, ''))}
            />
            <label> Gwei</label>
          </div>
          <button disabled={host !== player}>Collect</button>
        </form>
        <hr />
      </div>
      <h2>{message}</h2>
    </div>
  );
};

export default App;

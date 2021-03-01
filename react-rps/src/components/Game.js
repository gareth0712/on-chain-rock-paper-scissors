import React, { useState, useEffect } from 'react';
import web3 from '../utils/web3';
import rps from '../utils/rps';
import actions from '../utils/actions';
import randomNumber from '../utils/randomNumber';
import Message from './Message';

const Game = ({ gameMessage, setGameMessage, host, player, bankroll }) => {
  const [betInput, setBetInput] = useState(''); // String Since the input of user is always String
  const [playerAction, setPlayerAction] = useState('');
  const [playerBalance, setPlayerBalance] = useState('');

  const onPlayerSubmit = async (event) => {
    // We do not want the event submit works like the traditional html way
    event.preventDefault();
    let betInWei;
    if (betInput !== '') {
      betInWei = web3.utils.toWei(betInput, 'gwei');
    }
    if (playerAction !== '' && betInput !== '' && betInWei > 0 && betInWei <= bankroll) {
      setGameMessage('Pending transaction to be completed...');
      await rps.methods.playerPlaceBet(web3.utils.keccak256(playerAction), randomNumber()).send({
        from: player,
        value: betInWei,
      });

      const winner = await rps.methods.lastWinner().call();
      const hostLastAction = actions[await rps.methods.hostLastAction().call()];
      if (winner === host) {
        setGameMessage(`Host's action is ${hostLastAction}. Sorry, you lost the game. But you will win again!`);
      } else if (winner === player) {
        setGameMessage(
          `Host's action is ${hostLastAction}. Congratulations, you won the game and you got ${betInput * 2} Gwei!`
        );
      } else {
        setGameMessage(`Host's action is ${hostLastAction}. Draw game!`);
      }
    } else {
      setGameMessage(
        'Bet amount of at least 1 Gwei and at most same amount as the bankroll will be accepted and please ensure you have selected an action in order to play the game!'
      );
    }
  };

  const getPlayerBalance = async () => {
    if (player !== '') {
      setPlayerBalance(await web3.eth.getBalance(player));
    }
  };

  useEffect(() => {
    getPlayerBalance();
  });

  return (
    <div>
      <form onSubmit={onPlayerSubmit}>
        <h4>Want to try your luck?</h4>
        <p>Your Address: {player}</p>
        <p>Your Balance: {web3.utils.fromWei(playerBalance, 'gwei')} Gwei</p>
        <div>
          <label>Amount of Gwei to place a bet </label>
          <input value={betInput} onChange={(event) => setBetInput(event.target.value.replace(/\D/, ''))} />
          <select value={playerAction} onChange={(event) => setPlayerAction(event.target.value)}>
            <option value="" defaultValue={true}>
              Select
            </option>
            <option value="rock">Rock</option>
            <option value="paper">Paper</option>
            <option value="scissors">Scissors</option>
          </select>
        </div>
        <button disabled={bankroll === '0'}>Enter</button>
      </form>
      <Message message={gameMessage} />
      <hr />
    </div>
  );
};

export default Game;

import React, { useState, useEffect } from 'react';
import web3 from '../utils/web3';
import rps from '../utils/rps';
import actions from '../utils/actions';
import randomNumber from '../utils/randomNumber';
import Message from './Message';
import Container from './Container';

const Game = ({ gameMessage, setGameMessage, host, player, bankroll, fomoReleasingToOwner }) => {
  const [betInput, setBetInput] = useState(''); // String Since the input of user is always String
  const [playerAction, setPlayerAction] = useState('');
  const [playerBalance, setPlayerBalance] = useState('');

  const onPlayerSubmit = async (event) => {
    // We do not want the event submit works like the traditional html way
    event.preventDefault();
    let betInWei;
    if (betInput !== '') {
      betInWei = +web3.utils.toWei(betInput, 'gwei');
    }
    if (playerAction !== '' && betInput !== '' && betInWei > 0 && betInWei <= bankroll && !fomoReleasingToOwner) {
      setGameMessage('Pending transaction to be completed...');
      await handlePlacingBet(betInWei);
    } else if (fomoReleasingToOwner) {
      setGameMessage(
        'Fomo Pool timer is over and currently pending fomo pool owner to collect the fomo rewards. Will resume the game upon user collected the rewards'
      );
    } else {
      setGameMessage(
        'Bet amount of at least 1 Gwei and at most same amount as the bankroll will be accepted and please ensure you have selected an action in order to play the game!'
      );
    }
  };

  const handlePlacingBet = async (betInWei) => {
    try {
      await rps.methods.playerPlaceBet(web3.utils.keccak256(playerAction), randomNumber()).send({
        from: player,
        value: betInWei,
      });
      const winner = await rps.methods.lastWinner().call();
      const hostLastAction = actions[await rps.methods.hostLastAction().call()];
      printGameMessage(winner, hostLastAction);
    } catch (err) {
      if (err.message.includes('User denied transaction signature')) {
        setGameMessage(
          'Player denied the transaction. Please note that player has to press confirm in Metamask in order to place a bet.'
        );
      } else {
        setGameMessage('Error occurred in transaction. Please try again.');
      }
    }
  };

  const printGameMessage = (winner, hostLastAction) => {
    if (winner === host) {
      setGameMessage(`Host's action is ${hostLastAction}. Sorry, you lost the game. But you will win again!`);
    } else if (winner === player) {
      const reward = betInput * 2;
      setGameMessage(
        `Host's action is ${hostLastAction}. Congratulations, you won the game and the reward is ${reward}. You got ${
          reward * 0.95
        } Gwei! The remaining ${reward * 0.05} Gwei will be allocated to the Fomo Pool.`
      );
    } else {
      setGameMessage(`Host's action is ${hostLastAction}. Draw game!`);
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
    <Container>
      <form onSubmit={onPlayerSubmit}>
        <h2>Want to try your luck?</h2>
        <p>Your Address: {player}</p>
        <p>Your Balance: {web3.utils.fromWei(playerBalance, 'gwei')} Gwei</p>
        <div className="mb-3">
          <label className="form-label">Amount of Gwei to place a bet </label>
          <input
            className="form-control"
            disabled={bankroll === '0'}
            value={betInput}
            onChange={(event) => setBetInput(event.target.value.replace(/\D/, ''))}
          />
          <p />
          <select
            className="form-select"
            disabled={bankroll === '0'}
            value={playerAction}
            onChange={(event) => setPlayerAction(event.target.value)}
          >
            <option value="" defaultValue={true}>
              Select
            </option>
            <option value="rock">Rock</option>
            <option value="paper">Paper</option>
            <option value="scissors">Scissors</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={bankroll === '0'}>
          Enter
        </button>
      </form>
      <Message message={gameMessage} />
    </Container>
  );
};

export default Game;

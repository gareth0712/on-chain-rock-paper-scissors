import React from 'react';
import web3 from '../utils/web3';

const Header = ({ host, bankroll }) => {
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
    </div>
  );
};

export default Header;

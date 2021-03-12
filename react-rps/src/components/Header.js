import React from 'react';
import web3 from '../utils/web3';
import Container from './Container';

const Header = ({ host, bankroll, fomoBalance }) => {
  const renderBankrollText = () => {
    if (bankroll === '0') {
      return (
        <p>No bankroll is available at the moment. Please wait until host deposit some bankroll to start the game.</p>
      );
    }
    if (fomoBalance === '0') {
      return <p>The current available bankroll for players to win is {web3.utils.fromWei(bankroll, 'gwei')} Gwei!</p>;
    } else {
      const actualAvailableBankroll = +bankroll - +fomoBalance;
      return (
        <p>
          Given Fomo pool balance of {web3.utils.fromWei(String(fomoBalance), 'gwei')} Gwei, The current available
          bankroll for players to win is {web3.utils.fromWei(String(actualAvailableBankroll), 'gwei')} Gwei
        </p>
      );
    }
  };

  return (
    <Container>
      <h2>Rock Paper Scissors Game</h2>
      <p>This contract is hosted by {host}.</p>
      {renderBankrollText()}
    </Container>
  );
};

export default Header;

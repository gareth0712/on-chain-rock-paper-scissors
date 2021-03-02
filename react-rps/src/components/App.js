import React, { useState, useEffect } from 'react';
import web3 from '../utils/web3';
import './App.css';
import rps from '../utils/rps';
// Components
import Header from './Header';
import Verify from './Verify';
import Game from './Game';
import Fomo from './Fomo';
import HostOperations from './HostOperations';

const App = () => {
  // Host-related
  // String since web3.eth.getBalance returns string
  const [bankroll, setBankroll] = useState('');
  // Application-related
  const [host, setHost] = useState('');
  const [player, setPlayer] = useState('');
  const [hostOpsMessage, setHostOpsMessage] = useState('');
  const [gameMessage, setGameMessage] = useState('');
  // Fomo
  const [fomoTimerOn, setFomoTimerOn] = useState(false);
  const [fomoEndTime, setFomoEndTime] = useState(0);
  const [fomoOwner, setFomoOwner] = useState('');
  const [fomoBalance, setFomoBalance] = useState(0);
  // If set to true, players are unable to place another bet until fomo owner receives his rewards
  const [fomoReleasingToOwner, setFomoReleasingToOwner] = useState(false);

  const getStates = async () => {
    setHost(await rps.methods.host().call());
    setBankroll(await web3.eth.getBalance(rps.options.address));

    const thePlayer = await web3.eth.getAccounts();
    if (thePlayer[0] !== '') {
      const signedPlayerAddress = await web3.utils.toChecksumAddress(thePlayer[0]);
      setPlayer(signedPlayerAddress);
    }
  };

  // To detect changes when user change his Metamask account
  window.ethereum.on('accountsChanged', function (accounts) {
    getStates();
  });

  useEffect(() => {
    getStates();
  });

  return (
    <div>
      <Header host={host} bankroll={bankroll} fomoBalance={fomoBalance} />
      <Fomo
        player={player}
        fomoTimerOn={fomoTimerOn}
        setFomoTimerOn={setFomoTimerOn}
        fomoEndTime={fomoEndTime}
        setFomoEndTime={setFomoEndTime}
        fomoOwner={fomoOwner}
        setFomoOwner={setFomoOwner}
        fomoBalance={fomoBalance}
        setFomoBalance={setFomoBalance}
        fomoReleasingToOwner={fomoReleasingToOwner}
        setFomoReleasingToOwner={setFomoReleasingToOwner}
      />
      <Game
        gameMessage={gameMessage}
        setGameMessage={setGameMessage}
        host={host}
        player={player}
        bankroll={bankroll}
        fomoReleasingToOwner={fomoReleasingToOwner}
      />
      <Verify />
      <HostOperations
        bankroll={bankroll}
        fomoBalance={fomoBalance}
        hostOpsMessage={hostOpsMessage}
        setHostOpsMessage={setHostOpsMessage}
        host={host}
        player={player}
      />
    </div>
  );
};

export default App;

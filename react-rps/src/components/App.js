import React, { useState, useEffect } from 'react';
import web3 from '../utils/web3';
import './App.css';
import rps from '../utils/rps';
// Components
import Header from './Header';
import Verify from './Verify';
import Game from './Game';
import HostOperations from './HostOperations';

const App = () => {
  // Host-related
  const [bankroll, setBankroll] = useState(''); // String since web3.eth.getBalance returns string
  // Application-related
  const [host, setHost] = useState('');
  const [player, setPlayer] = useState('');
  const [hostOpsMessage, setHostOpsMessage] = useState('');
  const [gameMessage, setGameMessage] = useState('');

  const getStates = async () => {
    setHost(await rps.methods.host().call());
    setBankroll(await web3.eth.getBalance(rps.options.address));

    const thePlayer = await web3.eth.getAccounts();
    if (thePlayer[0] !== '') {
      const signedPlayerAddress = await web3.utils.toChecksumAddress(thePlayer[0]);
      setPlayer(signedPlayerAddress);
    }
  };

  useEffect(() => {
    getStates();
  });

  return (
    <div>
      <Header host={host} bankroll={bankroll} />
      <Game gameMessage={gameMessage} setGameMessage={setGameMessage} host={host} player={player} bankroll={bankroll} />
      <Verify />
      <HostOperations
        hostOpsMessage={hostOpsMessage}
        setHostOpsMessage={setHostOpsMessage}
        host={host}
        player={player}
      />
    </div>
  );
};

export default App;

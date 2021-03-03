import React, { useState, useEffect } from 'react';
import web3 from '../utils/web3';
import rps from '../utils/rps';
import calculateTimeLeft from '../utils/calculateTimeLeft';
import Message from './Message';

const Fomo = ({
  player,
  fomoTimerOn,
  setFomoTimerOn,
  fomoEndTime,
  setFomoEndTime,
  fomoOwner,
  setFomoOwner,
  fomoBalance,
  setFomoBalance,
  fomoReleasingToOwner,
  setFomoReleasingToOwner,
}) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [fomoMessage, setFomoMessage] = useState('');
  let timesUp;

  const checkReleaseFomo = async () => {
    if (
      timeLeft.hours === 0 &&
      timeLeft.minutes === 0 &&
      timeLeft.seconds === 0 &&
      fomoBalance > 0 &&
      !fomoReleasingToOwner &&
      timesUp
    ) {
      // Disable other players from placing bet when the fomo pool owner is receiving his rewards
      setFomoReleasingToOwner(true);
      // Only fomo pool owner is able to get the reward
      if (player !== fomoOwner) return;
      await releaseFomo();
    }
  };

  const releaseFomo = async () => {
    try {
      await rps.methods.releaseFomo().send({
        from: fomoOwner,
      });
      setFomoReleasingToOwner(false);
      timesUp = false;
    } catch (err) {
      if (err.message.includes('User denied transaction signature')) {
        setFomoMessage('Fomo pool owner denied the transaction. Please refresh to get the fomo pool balance.');
      } else {
        setFomoMessage(
          'Error occurred during release of fomo pool balance to fomo pool owner. Please refresh to try again.'
        );
      }
    }
  };

  const showCountdown = () => {
    if (fomoEndTime === 0) return 'Fomo Timer is off';
    if (timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0) {
      timesUp = true;
      return "Fomo timer's time is up!";
    }
    // In the beginning, it is {}. To avoid error, set a placeholder
    if (!Object.keys(timeLeft).length) return 'Obtaining fomo pool timer details ...';
    return `${timeLeft.hours} hours ${timeLeft.minutes} minutes ${timeLeft.seconds} seconds`;
  };

  const showTimerOwner = () => {
    if (!fomoTimerOn || fomoOwner === '' || fomoOwner === '0x0000000000000000000000000000000000000000') {
      return 'Fomo timer is off.';
    }
    return fomoOwner;
  };

  const getStates = async () => {
    setFomoTimerOn(await rps.methods.fomoTimerOn().call());
    setFomoEndTime(+(await rps.methods.fomoEndTime().call()));
    setFomoOwner(await rps.methods.fomoOwner().call());
    setFomoBalance(await rps.methods.fomoBalance().call());
  };

  useEffect(() => {
    getStates();
    if (fomoEndTime !== 0) {
      const timer = setTimeout(() => {
        if (timesUp && !fomoReleasingToOwner) {
          checkReleaseFomo();
        }
        setTimeLeft(calculateTimeLeft(fomoEndTime));
      }, 1000);
      return () => clearTimeout(timer);
    }
  });

  return (
    <div>
      <h2>Fomo Pool</h2>
      <p>Fomo Pool Timer status: {fomoTimerOn ? 'On' : 'Off'}</p>
      <p>Fomo Pool remaining time: {showCountdown()}</p>
      <p>Fomo Pool Owner: {showTimerOwner()}</p>
      <p>Fomo Pool Balance: {web3.utils.fromWei(String(fomoBalance), 'gwei')} Gwei</p>
      <Message message={fomoMessage} />
      <hr />
    </div>
  );
};

export default Fomo;

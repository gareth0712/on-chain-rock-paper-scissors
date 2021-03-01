import React, { useState } from 'react';
import rps from '../utils/rps';
import actions from '../utils/actions';
import randomNumber from '../utils/randomNumber';

const Verify = () => {
  const [hostAction, setHostAction] = useState('');

  const onVerify = async () => {
    const message = `Host's action is:`;
    const theHostAction = await rps.methods.getHostAction(randomNumber()).call();
    setHostAction(`${message} ${actions[theHostAction]}`);
  };

  return (
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
      <hr />
    </div>
  );
};

export default Verify;

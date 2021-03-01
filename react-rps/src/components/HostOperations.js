import React, { useState } from 'react';
import web3 from '../utils/web3';
import rps from '../utils/rps';
import Message from './Message';
import RpsForm from './RpsForm';

const HostOperations = ({ hostOpsMessage, setHostOpsMessage, host, player }) => {
  const [bankrollInput, setBankrollInput] = useState('');
  const [withdrawalInput, setWithdrawalInput] = useState('');

  const onSubmitForm = async (event, input, setInput, successMessage, errorMessage, method) => {
    event.preventDefault();
    if (player === host && input !== '' && input > 0) {
      setHostOpsMessage('Pending transaction to be completed...');

      const amountInWei = web3.utils.toWei(input, 'gwei');
      if (input === bankrollInput) {
        await rps.methods[method]().send({
          from: host,
          value: amountInWei,
        });
      } else if (input === withdrawalInput) {
        await rps.methods[method](amountInWei).send({
          from: host,
        });
      }

      setHostOpsMessage(successMessage);
    } else {
      setHostOpsMessage(errorMessage);
    }
  };

  const onHostSubmitBankroll = async (event) => {
    const successMessage = `You have successfully added ${bankrollInput} Gwei to the bankroll!`;
    const errorMessage =
      'Only host can perform this operation and please ensure you have entered a positive bankroll in Gwei!';
    onSubmitForm(event, bankrollInput, setBankrollInput, successMessage, errorMessage, 'hostPlaceBankroll');
  };

  const onHostSubmitWitdrawal = async (event) => {
    const successMessage = `You have successfully collected ${withdrawalInput} Gwei from the bankroll back to your wallet!`;
    const errorMessage =
      'Only host can perform this operation and please ensure you have entered a positive amount to withdraw from bankroll in Gwei!';
    onSubmitForm(event, withdrawalInput, setWithdrawalInput, successMessage, errorMessage, 'collectFromBalance');
  };

  return (
    <div>
      <h2>Host-only Operations</h2>
      <RpsForm
        onSubmit={onHostSubmitBankroll}
        input={bankrollInput}
        setInput={setBankrollInput}
        hostOnly={true}
        host={host}
        player={player}
        header="Add Bankroll"
        label="Amount to add to bankroll "
      />
      <RpsForm
        onSubmit={onHostSubmitWitdrawal}
        input={withdrawalInput}
        setInput={setWithdrawalInput}
        hostOnly={true}
        host={host}
        player={player}
        header="Collect Bankroll"
        label="Amount to collect from bankroll "
      />
      <Message message={hostOpsMessage} />
      <hr />
    </div>
  );
};

export default HostOperations;

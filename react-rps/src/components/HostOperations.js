import React, { useState } from 'react';
import web3 from '../utils/web3';
import rps from '../utils/rps';
import Message from './Message';
import RpsForm from './RpsForm';
import Container from './Container';

const HostOperations = ({ bankroll, fomoBalance, hostOpsMessage, setHostOpsMessage, host, player }) => {
  const [bankrollInput, setBankrollInput] = useState('');
  const [withdrawalInput, setWithdrawalInput] = useState('');

  const onHostSubmitBankroll = async (event) => {
    const successMessage = `You have successfully added ${bankrollInput} Gwei to the bankroll!`;
    const errorMessage =
      'Only host can perform this operation and please ensure you have entered a positive bankroll in Gwei!';
    onSubmitForm(event, bankrollInput, successMessage, errorMessage, 'hostPlaceBankroll');
  };

  const onHostSubmitWitdrawal = async (event) => {
    const successMessage = `You have successfully collected ${withdrawalInput} Gwei from the bankroll back to your wallet!`;
    const errorMessage =
      'Only host can perform this operation and please ensure you have entered a positive amount to withdraw from bankroll in Gwei!';
    onSubmitForm(event, withdrawalInput, successMessage, errorMessage, 'collectFromBalance');
  };

  const onSubmitForm = async (event, input, successMessage, errorMessage, method) => {
    event.preventDefault();
    if (player === host && input !== '' && input > 0) {
      const amountAvailableForWithdrawal = web3.utils.toWei(String(bankroll - fomoBalance), 'gwei');
      if (method === 'collectFromBalance' && input > amountAvailableForWithdrawal) {
        return setHostOpsMessage('Amount of withdrawal input is greater than available bankroll.');
      }

      setHostOpsMessage('Pending transaction to be completed...');

      const amountInWei = web3.utils.toWei(input, 'gwei');

      try {
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
      } catch (err) {
        if (err.message.includes('User denied transaction signature')) {
          setHostOpsMessage('Host denied the transaction. Please try again.');
        } else {
          setHostOpsMessage('Error occurred in transaction. Please try again.');
        }
      }
    } else {
      setHostOpsMessage(errorMessage);
    }
  };

  return (
    <Container>
      <h2>Host-only Operations</h2>
      <div className="container">
        <div className="row">
          <RpsForm
            className="col-md"
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
            className="col-md"
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
        </div>
      </div>
    </Container>
  );
};

export default HostOperations;

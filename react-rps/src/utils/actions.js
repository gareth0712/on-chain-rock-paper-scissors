import web3 from './web3';

const rock = web3.utils.keccak256('rock');
const paper = web3.utils.keccak256('paper');
const scissors = web3.utils.keccak256('scissors');

const actions = {};
actions[rock] = 'rock';
actions[paper] = 'paper';
actions[scissors] = 'scissors';

export default actions;

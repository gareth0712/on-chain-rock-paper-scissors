const path = require('path');
const fs = require('fs');
const solc = require('solc');

module.exports = (Contract) => {
  const inboxPath = path.resolve(__dirname, 'contracts', `${Contract}.sol`);
  const source = fs.readFileSync(inboxPath, 'utf8');
  // source code and number of contracts to be compiled
  return solc.compile(source, 1).contracts[':' + Contract];
};

# on-chain-rock-paper-scissors

rock paper scissors game that is on a public Ethereum testnet that can be used with Metamask

# Terminologies

I shall explain my terminologies and understand for gambling / rps game. If the follow differ from real world scenario, please let me know.

1. Bankroll: Host's amount that is put into the contract for player's to win. Host cna withdraw his bankroll anytime.
2. Bet: Players place their bet to enter the game and get 2 times the amount of bet if he/she wins. He/She gets nothing in return in case he loses
3. RPS: Rock paper scissors rules -> Rock beats scissors; Paper beats rock; Scissors beat paper.

# Install dependencies

1. Run `yarn install` in the root directory
2. `cd react-rps` go to React directory
3. Run `yarn install` in "react-rps" directory

# Start React application

1. Ensure you have the on-chain smart contract address and ABI provided in "react-rps/.env". In the .env file, ABI and address of a contract has already been deployed to Ropsten test network is provided by default.
2. In root directory, run `yarn run start`.
3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
4. You should see the Lottery contract page displayed on the page and it is connected to a deployed on-chain smart contract (only on Ropsten Test Network) that you can create transaction (by placing an amount to enter the lottery).
5. Whenever prompted to make connection with your Metamask plugin, make sure you allow it to establish connection to your account with the on-chain rps game.

# Deployment of smart contract to Testnet procedures

1. `cd config` Go to "config" directory
2. Amend the config.env to add your mnemonic phrases of Metamask as the host of deployment of Rps.sol contract
3. Save the config.env
4. `cd ..` Go back to the root directory
5. `yarn run deploy` To deploy the contract

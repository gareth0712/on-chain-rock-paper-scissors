# on-chain-rock-paper-scissors

rock paper scissors game that is on a public Ethereum testnet that can be used with Metamask

# Terminologies

I shall explain my terminologies and understanding for gambling / rps game / the requirement of assignment. If the following differ from real world wordings, I will correct it asap.

1. Bankroll: Host's amount that is put into the contract for player's to win. Host cna withdraw his bankroll anytime.
2. Bet: Players place their bet to enter the game and get 2 times the amount of bet if he/she wins. He/She gets nothing in return in case he loses
3. RPS: Rock paper scissors rules -> Rock beats scissors; Paper beats rock; Scissors beat paper.
4. Level-1: refers to contract that meets the level-1 requirement. The filename is `contracts/Rps.sol`.
5. Level-2: refers to contract that meets the level-2 requirement. The filename is `contracts/RpsAdvanced.sol`.

# Install dependencies

## NPM packages

1. Run `yarn install` in the root directory
2. `cd react-rps` go to React directory
3. Run `yarn install` in "react-rps" directory

## Browser extensions
Please ensure that you have installed and configured the browser extension "Metamask" by confirming the following:
1. You have installed the Metamask extension from https://metamask.io
2. You have set up a Metamask account / wallet and it is ready to connect to any Web3 application that requires connection to Metamask.
3. Switch to use the public Ropsten Test Network.
4. Metamask is able to inject a global variable "window.ethereum" in the browser. Way to check: When you "inspect" any webpage, in the "console" tab, type `window.ethereum` and it will return a valid object. If it returns `undefined`, please try again by reopening the browser or reinstalling the "Metamask" extension.

# Start React application

* Currently only support contract that meets the Level-2 requirement, i.e. `contracts/RpsAdvanced.sol`

1. Please follow the "Install dependencies" section to install the necessary packages and browser's extension for running the application.
2. In `react-rps/.env` file, default values are given for easy set up and it will link to an on-chain Level 2 contract on Ropsten test network. Go to step 3 directly if you don't use your deployed Rps level-2 contract. If you prefer to use your deployed Rps level-2 contract, you have to follow the deployment procedures of next section and come back when you have the dpeloyed block address and ABI. Then you can follow the points below for various environmental variables set up:
* `REACT_APP_ENV`: This tells React app which block addresss to establish connection with and abi to create local contract instance. 
    * Input `RpsAdvanced`: Instruct React app to follow address and ABI provided in `REACT_APP_ADVANCED_BLOCK_ADDRESS` and `REACT_APP_ADVANCED_ABI` respectively
    * Input `RpsAdvancedTest`: Instruct React app to follow address and ABI provided in `REACT_APP_ADVANCED_TEST_BLOCK_ADDRESS` and `REACT_APP_ADVANCED_TEST_ABI`. This is mainly for testing. 
* `REACT_APP_ADVANCED_ABI`: Supply the Level-2 ABI you obtained from deployment procedures below.
* `REACT_APP_ADVANCED_BLOCK_ADDRESS`: Supply the Level-2 Block address you obtained from deployment procedures below.
3. In root directory, run `yarn run start`. Alternatively, you can `cd react-rps` and run `yarn run start`. 
4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
5. Upon successfully started a web server, a Metamask pop up window will prompt you to confirm connection between Metamask and the server, please click "Confirm".
6. You should see the Rock Paper Scissors page displayed on the page and it is connected to a deployed on-chain smart contract (By default, it is only on Ropsten Test Network).

# Deployment of smart contract to public Ethereum Testnet procedures

1. `cd config` Go to "config" directory
2. Follow the points below for various environmental variables set up in config.env:
* `NODE_ENV`: environment variable that affects provider for deployment. By default, `development` is supplied and please use this value for dpeloyment to public Ethernet testnet.
* `CONTRACT`: represents the contract you would like to deploy. Input `Rps` if you want to deploy contract that fits Level-1 requirement (Rps.sol); Input `RpsAdvanced` to deploy contract that fits Level-2 requirement (RpsAdvanced.sol).  
* `INFURA_URL`: URL that represents the type of testnet you would like to deploy the contract to. By default, an Infura URL of Ropsten public testnet is supplied to ease the deployment procedures. If you prefer to deploy to other public testnet (e.g. Kovan), please provide respective Infura URL for this line.
* `MNEMONIC`: your mnemonic phrases of Metamask as the host of deployment of Rps.sol/RpsAdvanced.sol contract. It is recommended to use a new Metamask account with no ether in mainnet but few ether in respestive testnet.
3. Save the config.env
4. `cd ..` Go back to the root directory
5. `yarn run deploy` To deploy the contract
6. Upon successful deployment, it prints the ABI and the deployed block address.
7. If you want to test the deployed contract with the React application of this repo, mark down the ABI and deployed block address of previous step and follow the "Start React application" guidelines (In particular, make sure you follow step 2 correctly).

# Test the contracts

* Both level 1 Rps (Rps.sol) and level 2 Rps (RpsAdvanced.sol) in `contracts` directory will be tested
1. Install necessary dependencies (as a minimum, run `yarn install`).
2. Run `yarn run test` to initiate the tests.
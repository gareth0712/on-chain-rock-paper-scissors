pragma solidity ^0.4.17;

contract RpsAdvanced {
    address public host;
    address public lastWinner;
    bytes32 public hostLastAction;
    bytes32[3] private actions;
    mapping (bytes32 => mapping(bytes32 => int)) private actionsMatrix;
    // Fomo Pool variables
    bool public fomoTimerOn;
    address public fomoOwner;
    uint public fomoEndTime;
    uint public fomoBalance;

    // Constructor
    function RpsAdvanced() public {
        host = msg.sender;
        fomoTimerOn = false;
        fomoBalance = 0;
        actions = [keccak256("rock"), keccak256("paper"), keccak256("scissors")];
        // actionsMatrix[host's action][player's action] => 1 means host wins; 2 means player wins
        actionsMatrix[actions[0]][actions[0]] = 0;
        actionsMatrix[actions[0]][actions[1]] = 2;
        actionsMatrix[actions[0]][actions[2]] = 1;
        actionsMatrix[actions[1]][actions[0]] = 1;
        actionsMatrix[actions[1]][actions[1]] = 0;
        actionsMatrix[actions[1]][actions[2]] = 2;
        actionsMatrix[actions[2]][actions[0]] = 2;
        actionsMatrix[actions[2]][actions[1]] = 1;
        actionsMatrix[actions[2]][actions[2]] = 0;
    }

    // Functions for the game    
    function getHostAction(uint seed) public view returns (bytes32) {
        uint index = random(seed) % actions.length;
        return actions[index];
    }
    
    function playerPlaceBet(bytes32 playerActionHash, uint seed) public payable {
        require(playerActionHash == actions[0] || playerActionHash == actions[1] || playerActionHash == actions[2]);
        // Minimum amount of bet to play the game is 1 gwei
        require(msg.value >= 1000000000);
        // At this time, this.balance already added the player's bet
        // After deduction of fomo pool balance, ensure that there are at least double of bet amount in this.balance
        require(this.balance - fomoBalance >= msg.value * 2);

        if (fomoTimerOn == false) {
            updateFomoOwner(true);
        } else if (fomoTimerOn == true && msg.value >= fomoBalance * 10 / 100) {
            updateFomoOwner(false);
        }
        pickWinner(playerActionHash, seed);
    }

    function pickWinner(bytes32 playerActionHash, uint seed) private {
        hostLastAction = getHostAction(seed);
        int result = actionsMatrix[hostLastAction][playerActionHash];
        
        if (result == 2) { // Player wins
            handlePlayerWins();
        }
        else if (result == 1) { // Host wins
            lastWinner = host;
        }
        else {
            msg.sender.transfer(msg.value);
            lastWinner = 0x0;
        }
    }
    
    function handlePlayerWins() private {
        // (x * 2 * 0.95) got type error => (x * 190 / 100) will have the same result
        msg.sender.transfer(msg.value * 190 / 100);
        // (x * 2 * 0.05) got type error => (x * 10 / 100) will have the same result
        fomoBalance += msg.value * 10 / 100;
        lastWinner = msg.sender;
    }
    
    // Functions for fomo-pool
    function updateFomoOwner(bool turnOnTimer) private {
        if (turnOnTimer) {
            fomoTimerOn = true;
        }
        fomoOwner = msg.sender;
        fomoEndTime = now + 60 minutes;
    }
    
    function releaseFomo() public {
        // Only fomo pool owner can get the fomo pool balance
        require(fomoTimerOn == true && msg.sender == fomoOwner && fomoBalance > 0 && now - fomoEndTime >= 0);
        msg.sender.transfer(fomoBalance);
        fomoBalance = 0;
        fomoOwner = 0x0;
        fomoEndTime = 0;
        fomoTimerOn = false;
    }
    
    // Helper functions
    function hostPlaceBankroll() public payable restricted {
        require(msg.value > 0);
    }
    
    function random(uint seed) private view returns (uint) {
        return uint(keccak256(block.difficulty, now, seed));
    }

    function collectFromBalance(uint amount) public restricted {
        require(amount <= this.balance - fomoBalance);
        host.transfer(amount);
    }

    modifier restricted() {
        require(msg.sender == host);
        _;
    }
}

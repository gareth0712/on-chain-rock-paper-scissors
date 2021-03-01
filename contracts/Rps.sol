pragma solidity ^0.4.17;

contract Rps {
    address public host;
    address public lastWinner;
    bytes32 public hostLastAction;
    bytes32[3] private actions;
    mapping (bytes32 => mapping(bytes32 => int)) private actionsMatrix;

    // Constructor
    function Rps() public {
        host = msg.sender;
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
        // Ensure that there are at least double of amount of bet in this.balance
        require(this.balance >= msg.value * 2);
        pickWinner(playerActionHash, seed);
    }

    function pickWinner(bytes32 playerActionHash, uint seed) private {
        hostLastAction = getHostAction(seed);
        int result = actionsMatrix[hostLastAction][playerActionHash];
        
        if (result == 2) { // Player wins
            msg.sender.transfer(msg.value * 2);
            lastWinner = msg.sender;
        }
        else if (result == 1) { // Host wins
            lastWinner = host;
        }
        else {
            msg.sender.transfer(msg.value);
            lastWinner = 0x0;
        }
    }
    
    // Helper functions
    function hostPlaceBankroll() public payable restricted {
        require(msg.value > 0);
    }
    
    function random(uint seed) private view returns (uint) {
        return uint(keccak256(block.difficulty, now, seed));
    }

    function collectFromBalance(uint amount) public restricted {
        require(amount <= this.balance);
        host.transfer(amount);
    }

    modifier restricted() {
        require(msg.sender == host);
        _;
    }
}

pragma solidity ^0.4.17;

contract Rps {
    address public host;
    mapping (address => uint) playersBet;
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
    function getHostAction() public view returns (bytes32) {
        uint index = random() % actions.length;
        return actions[index];
    }
    
    function playerPlaceBet(bytes32 playerActionHash) public payable {
        require(playerActionHash == actions[0] || playerActionHash == actions[1] || playerActionHash == actions[2]);
        // Minimum amount of bet to play the game is 1 gwei
        require(msg.value >= 1000000000);
        // Ensure that there are at least double of amount of bet placed by player in contract balance
        require(this.balance - msg.value >= msg.value * 2);
        
        playersBet[msg.sender] += msg.value;
        pickWinner(playerActionHash);
    }

    function pickWinner(bytes32 playerActionHash) private {
        hostLastAction = getHostAction();
        int result = actionsMatrix[hostLastAction][playerActionHash];
        
        if (result == 2) { // Player wins
            msg.sender.transfer(playersBet[msg.sender] * 2);
            playersBet[msg.sender] = 0;
            lastWinner = msg.sender;
        }
        else if (result == 1) { // Host wins
            playersBet[msg.sender] = 0;
            lastWinner = host;
        }
        else {
            msg.sender.transfer(playersBet[msg.sender]);
            playersBet[msg.sender] = 0;
            lastWinner = 0x0;
        }
    }
    
    // Helper functions
    function hostPlaceBankroll() public payable restricted {
        require(msg.value > 0);
    }
    
    function random() private view returns (uint) {
        return uint(keccak256(block.difficulty, now, this.balance));
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

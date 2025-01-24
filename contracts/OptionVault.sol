// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IOptionVault.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract OptionVault is IOptionVault, ReentrancyGuard {
    using Math for uint256;

    IERC20 public immutable collateralToken;
    mapping(address => uint256) public balances;
    uint256 public totalCollateral;
    
    constructor(address _collateralToken) {
        collateralToken = IERC20(_collateralToken);
    }
    
    function deposit(uint256 amount) external override nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        balances[msg.sender] = balances[msg.sender] + amount;
        totalCollateral = totalCollateral + amount;
    }

    
    function withdraw(uint256 amount) external override nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] = balances[msg.sender] - amount;
        totalCollateral = totalCollateral - amount;
        
        require(collateralToken.transfer(msg.sender, amount), "Transfer failed");
    }
    
    function getCollateralBalance() external view override returns (uint256) {
        return balances[msg.sender];
    }
}
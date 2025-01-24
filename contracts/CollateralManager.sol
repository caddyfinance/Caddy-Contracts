// contracts/CollateralManager.sol
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IOptionsCore.sol";

contract CollateralManager is ReentrancyGuard {
    IERC20 public immutable collateralToken;
    uint256 public constant LOCK_PERCENTAGE = 10;
    
    mapping(address => uint256) public collateralBalance;

    event CollateralDeposited(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);

    constructor(address _collateralToken) {
        collateralToken = IERC20(_collateralToken);
    }

    function depositCollateral(uint256 amount) external nonReentrant {
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        collateralBalance[msg.sender] += amount;
        emit CollateralDeposited(msg.sender, amount);
    }

    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(getAvailableCollateral(msg.sender) >= amount, "Insufficient collateral");
        collateralBalance[msg.sender] -= amount;
        require(collateralToken.transfer(msg.sender, amount), "Transfer failed");
        emit CollateralWithdrawn(msg.sender, amount);
    }

    function getAvailableCollateral(address user) public view returns (uint256) {
        uint256 lockedCollateral = getLockedCollateral(user);
        return collateralBalance[user] - (lockedCollateral * LOCK_PERCENTAGE / 100);
    }

    function getLockedCollateral(address user) internal view returns (uint256) {
        return 0; // To be implemented by OptionsCore
    }
}
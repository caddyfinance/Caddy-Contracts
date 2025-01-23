// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IOptionController {
    function createOption(
        address asset,
        uint256 strike,
        uint256 expiry,
        bool isCall
    ) external returns (uint256 optionId);
    
    function settleOption(uint256 optionId) external returns (uint256 pnl);
}

interface IStrategyManager {
    function validateStrategy(
        uint256 strategyId,
        address asset,
        uint256 amount
    ) external view returns (bool);
    
    function executeStrategy(
        uint256 strategyId,
        address asset,
        uint256 amount
    ) external returns (uint256 optionId);
}

interface IPriceOracle {
    function getAssetPrice(address asset) external view returns (uint256);
    function getVolatility(address asset) external view returns (uint256);
}

contract OptionsVault is ReentrancyGuard, Ownable {
    IERC20 public immutable asset;
    IOptionController public optionController;
    IStrategyManager public strategyManager;
    IPriceOracle public priceOracle;
    
    struct VaultState {
        uint256 totalAssets;
        uint256 totalShares;
        uint256 performanceFee;
        uint256 managementFee;
        uint256 lastFeeCollection;
        bool isPaused;
    }
    
    struct UserPosition {
        uint256 shares;
        uint256 lastDepositTime;
        uint256 pendingRewards;
    }
    
    VaultState public vaultState;
    mapping(address => UserPosition) public userPositions;
    mapping(uint256 => bool) public activeOptions;
    
    event Deposit(address indexed user, uint256 amount, uint256 shares);
    event Withdraw(address indexed user, uint256 shares, uint256 amount);
    event StrategyExecuted(uint256 indexed strategyId, uint256 optionId);
    event OptionSettled(uint256 indexed optionId, uint256 pnl);
    
    constructor(
        address _asset,
        address _optionController,
        address _strategyManager,
        address _priceOracle
    ) Ownable(msg.sender) ReentrancyGuard() {
        asset = IERC20(_asset);
        optionController = IOptionController(_optionController);
        strategyManager = IStrategyManager(_strategyManager);
        priceOracle = IPriceOracle(_priceOracle);
        
        vaultState = VaultState({
            totalAssets: 0,
            totalShares: 0,
            performanceFee: 2000, // 20% in basis points
            managementFee: 100,   // 1% in basis points
            lastFeeCollection: block.timestamp,
            isPaused: false
        });
    }
    
    modifier whenNotPaused() {
        require(!vaultState.isPaused, "Vault is paused");
        _;
    }
    
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        
        uint256 shares = calculateShares(amount);
        require(shares > 0, "Shares must be > 0");
        
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        userPositions[msg.sender].shares += shares;
        userPositions[msg.sender].lastDepositTime = block.timestamp;
        vaultState.totalShares += shares;
        vaultState.totalAssets += amount;
        
        emit Deposit(msg.sender, amount, shares);
    }
    
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0, "Shares must be > 0");
        require(shares <= userPositions[msg.sender].shares, "Insufficient shares");
        
        collectFees();
        
        uint256 amount = (shares * vaultState.totalAssets) / vaultState.totalShares;
        userPositions[msg.sender].shares -= shares;
        vaultState.totalShares -= shares;
        vaultState.totalAssets -= amount;
        
        require(asset.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdraw(msg.sender, shares, amount);
    }
    
    function executeStrategy(uint256 strategyId) external onlyOwner {
        require(
            strategyManager.validateStrategy(
                strategyId,
                address(asset),
                vaultState.totalAssets
            ),
            "Invalid strategy"
        );
        
        uint256 optionId = strategyManager.executeStrategy(
            strategyId,
            address(asset),
            vaultState.totalAssets
        );
        
        activeOptions[optionId] = true;
        emit StrategyExecuted(strategyId, optionId);
    }
    
    function settleOption(uint256 optionId) external onlyOwner {
        require(activeOptions[optionId], "Option not active");
        
        uint256 pnl = optionController.settleOption(optionId);
        activeOptions[optionId] = false;
        
        // Update vault assets with PnL
        if (pnl > 0) {
            vaultState.totalAssets += pnl;
        }
        
        emit OptionSettled(optionId, pnl);
    }
    
    function calculateShares(uint256 amount) public view returns (uint256) {
        if (vaultState.totalShares == 0) {
            return amount;
        }
        return (amount * vaultState.totalShares) / vaultState.totalAssets;
    }
    
    function collectFees() internal {
        uint256 timePassed = block.timestamp - vaultState.lastFeeCollection;
        if (timePassed == 0) return;
        
        // Calculate management fee
        uint256 managementFeeAmount = (vaultState.totalAssets * vaultState.managementFee * timePassed) / (365 days * 10000);
        
        // Update state
        vaultState.totalAssets -= managementFeeAmount;
        vaultState.lastFeeCollection = block.timestamp;
    }
}
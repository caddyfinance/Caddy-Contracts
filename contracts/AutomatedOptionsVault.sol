// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./MockUSDToken.sol";

contract AutomatedOptionsVault is ReentrancyGuard {
    IERC20 public asset;
    MockUSDToken public usdToken;
    AggregatorV3Interface public priceFeed;
    
    struct VaultState {
        uint256 totalAssets;
        uint256 lockedAssets;
        uint256 lastOptionBlock;
        uint256 lastSettlementBlock;
        bool isLocked;
    }
    
    struct Option {
        uint256 amount;
        uint256 strikePrice;
        uint256 premium;
        uint256 creationBlock;
        bool isActive;
        bool isExecuted;
    }
    
    VaultState public vaultState;
    mapping(uint256 => Option) public options;
    mapping(address => uint256) public userShares;
    uint256 public totalShares;
    uint256 public optionCounter;
    
    event OptionCreated(uint256 optionId, uint256 amount, uint256 strikePrice);
    event OptionPurchased(uint256 optionId, uint256 premium);
    event OptionSettled(uint256 optionId, bool exercised, uint256 amount);
    
    constructor(
        address _asset,
        address _priceFeed,
        address _usdToken
    ) {
        asset = IERC20(_asset);
        priceFeed = AggregatorV3Interface(_priceFeed);
        usdToken = MockUSDToken(_usdToken);
        vaultState = VaultState(0, 0, 0, 0, false);
    }
    
    function getLatestPrice() public view returns (uint256) {
        (, int256 price,,,) = priceFeed.latestRoundData();
        return uint256(price);
    }
    
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        uint256 shares = totalShares == 0 ? 
            amount : (amount * totalShares) / vaultState.totalAssets;
            
        require(asset.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        userShares[msg.sender] += shares;
        totalShares += shares;
        vaultState.totalAssets += amount;
        
        checkAndCreateOption();
    }
    
    function checkAndCreateOption() internal {
        if (block.number >= vaultState.lastOptionBlock + 50 && 
            !vaultState.isLocked &&
            vaultState.lockedAssets < (vaultState.totalAssets * 70) / 100) {
            
            uint256 currentPrice = getLatestPrice();
            uint256 strikePrice = (currentPrice * 110) / 100; // 10% above current price
            uint256 optionAmount = (vaultState.totalAssets * 10) / 100; // 10% of vault
            
            options[optionCounter] = Option({
                amount: optionAmount,
                strikePrice: strikePrice,
                premium: calculatePremium(strikePrice, currentPrice),
                creationBlock: block.number,
                isActive: true,
                isExecuted: false
            });
            
            vaultState.lockedAssets += optionAmount;
            vaultState.isLocked = true;
            vaultState.lastOptionBlock = block.number;
            
            emit OptionCreated(optionCounter, optionAmount, strikePrice);
            optionCounter++;
        }
    }
    
    // Mock function to simulate option purchase
    function mockPurchaseOption(uint256 optionId) external {
        require(block.number >= options[optionId].creationBlock + 30, "Too early");
        require(options[optionId].isActive, "Option not active");
        
        Option storage option = options[optionId];
        
        // Mock premium distribution
        uint256 premium = option.premium;
        usdToken.mint(address(this), premium);
        
        emit OptionPurchased(optionId, premium);
    }
    
    // Mock function to simulate option settlement
    function mockSettleOption(uint256 optionId) external {
        require(block.number >= options[optionId].creationBlock + 60, "Too early");
        Option storage option = options[optionId];
        require(option.isActive && !option.isExecuted, "Invalid option state");
        
        // Mock 1 in 5 options executing above strike
        bool exercised = optionId % 5 == 0;
        
        if (exercised) {
            // Option exercised - mint USD tokens
            uint256 settlementAmount = option.amount * option.strikePrice / 1e18;
            usdToken.mint(address(this), settlementAmount);
        } else {
            // Option not exercised - release assets
            vaultState.lockedAssets -= option.amount;
        }
        
        option.isActive = false;
        option.isExecuted = true;
        vaultState.isLocked = false;
        vaultState.lastSettlementBlock = block.number;
        
        emit OptionSettled(optionId, exercised, option.amount);
    }
    
    function calculatePremium(uint256 strikePrice, uint256 currentPrice) 
        internal pure returns (uint256) 
    {
        // Simplified premium calculation
        return (strikePrice - currentPrice) / 20; // 5% of the difference
    }
    
    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0 && shares <= userShares[msg.sender], "Invalid shares");
        require(!vaultState.isLocked, "Vault locked");
        
        uint256 amount = (shares * vaultState.totalAssets) / totalShares;
        require(amount <= vaultState.totalAssets - vaultState.lockedAssets, 
            "Insufficient free assets");
        
        userShares[msg.sender] -= shares;
        totalShares -= shares;
        vaultState.totalAssets -= amount;
        
        require(asset.transfer(msg.sender, amount), "Transfer failed");
    }
}
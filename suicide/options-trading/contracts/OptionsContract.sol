// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./DepositContract.sol";

contract OptionsContract is ReentrancyGuard {
    struct Option {
        uint256 strikePrice;
        uint256 premium;
        uint256 expirationTime;
        address buyer;
        bool isCall;
        bool isExecuted;
        bool isCancelled;
    }
    
    DepositContract public depositContract;
    AggregatorV3Interface public priceFeed;
    
    mapping(uint256 => Option) public options;
    uint256 public nextOptionId;
    
    event OptionCreated(uint256 indexed optionId, address indexed buyer, uint256 strikePrice, uint256 premium, uint256 expirationTime, bool isCall);
    event OptionExecuted(uint256 indexed optionId);
    event OptionCancelled(uint256 indexed optionId);
    
    constructor(address _depositContract, address _priceFeed) {
        depositContract = DepositContract(_depositContract);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }
    
    function createOption(
        uint256 strikePrice,
        uint256 premium,
        uint256 duration,
        bool isCall
    ) external nonReentrant returns (uint256) {
        require(premium > 0, "Premium must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(depositContract.getBalance(msg.sender) >= premium, "Insufficient deposit");
        
        uint256 optionId = nextOptionId++;
        options[optionId] = Option({
            strikePrice: strikePrice,
            premium: premium,
            expirationTime: block.timestamp + duration,
            buyer: msg.sender,
            isCall: isCall,
            isExecuted: false,
            isCancelled: false
        });
        
        emit OptionCreated(optionId, msg.sender, strikePrice, premium, block.timestamp + duration, isCall);
        return optionId;
    }
    
    function executeOption(uint256 optionId) external nonReentrant {
        Option storage option = options[optionId];
        require(msg.sender == option.buyer, "Not option buyer");
        require(!option.isExecuted, "Option already executed");
        require(!option.isCancelled, "Option cancelled");
        require(block.timestamp <= option.expirationTime, "Option expired");
        
        (, int256 price,,,) = priceFeed.latestRoundData();
        uint256 currentPrice = uint256(price);
        
        if (option.isCall) {
            require(currentPrice > option.strikePrice, "Current price below strike price");
        } else {
            require(currentPrice < option.strikePrice, "Current price above strike price");
        }
        
        option.isExecuted = true;
        emit OptionExecuted(optionId);
    }
    
    function cancelOption(uint256 optionId) external nonReentrant {
        Option storage option = options[optionId];
        require(msg.sender == option.buyer, "Not option buyer");
        require(!option.isExecuted, "Option already executed");
        require(!option.isCancelled, "Option already cancelled");
        
        option.isCancelled = true;
        emit OptionCancelled(optionId);
    }
    
    function getOption(uint256 optionId) external view returns (Option memory) {
        return options[optionId];
    }
}
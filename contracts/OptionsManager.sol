// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/IOptionPricing.sol";
import "./interfaces/IOptionVault.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract OptionsManager  {
    using Math for uint256;

    struct Option {
        uint256 strike;
        uint256 premium;
        uint256 expiry;
        uint256 collateral;
        bool isCall;
        address holder;
        address writer;
        bool exercised;
        bool closed;
    }
    
    IOptionPricing public pricingContract;
    IOptionVault public vault;
    IERC20 public underlyingToken;
    IERC20 public quoteToken;
    
    mapping(uint256 => Option) public options;
    uint256 public nextOptionId;
    
    event OptionCreated(uint256 indexed optionId, address indexed writer, address indexed holder);
    event OptionExercised(uint256 indexed optionId);
    event OptionClosed(uint256 indexed optionId);
    
    constructor(
        address _pricingContract,
        address _vault,
        address _underlyingToken,
        address _quoteToken
    ) {
        pricingContract = IOptionPricing(_pricingContract);
        vault = IOptionVault(_vault);
        underlyingToken = IERC20(_underlyingToken);
        quoteToken = IERC20(_quoteToken);
    }
    
    function writeOption(
        uint256 strike,
        uint256 expiry,
        uint256 collateral,
        bool isCall
    ) external  returns (uint256) {
        require(expiry > block.timestamp, "Invalid expiry");
        require(strike > 0, "Invalid strike");
        require(collateral > 0, "Invalid collateral");
        
        uint256 optionId = nextOptionId++;
        
        if (isCall) {
            require(quoteToken.transferFrom(msg.sender, address(this), collateral), "Collateral transfer failed");
        } else {
            require(underlyingToken.transferFrom(msg.sender, address(this), collateral), "Collateral transfer failed");
        }
        
        uint256 timeToExpiry = expiry - block.timestamp;
        uint256 currentPrice = getCurrentPrice(); // Would come from an oracle in production
        
        uint256 premium = pricingContract.getOptionPrice(
            strike,
            timeToExpiry,
            20e16, // 20% volatility for example
            currentPrice,
            isCall
        );
        
        options[optionId] = Option({
            strike: strike,
            premium: premium,
            expiry: expiry,
            collateral: collateral,
            isCall: isCall,
            holder: address(0),
            writer: msg.sender,
            exercised: false,
            closed: false
        });
        
        emit OptionCreated(optionId, msg.sender, address(0));
        return optionId;
    }
    
    function buyOption(uint256 optionId) external  {
        Option storage option = options[optionId];
        require(option.holder == address(0), "Option already purchased");
        require(!option.closed, "Option closed");
        require(block.timestamp < option.expiry, "Option expired");
        
        require(quoteToken.transferFrom(msg.sender, option.writer, option.premium), "Premium transfer failed");
        
        option.holder = msg.sender;
    }
    
    function exerciseOption(uint256 optionId) external  {
        Option storage option = options[optionId];
        require(msg.sender == option.holder, "Not option holder");
        require(!option.exercised, "Already exercised");
        require(!option.closed, "Option closed");
        require(block.timestamp <= option.expiry, "Option expired");
        
        uint256 currentPrice = getCurrentPrice();
        
        if (option.isCall) {
            require(currentPrice > option.strike, "Not profitable");
            uint256 profit = currentPrice - option.strike;
            require(quoteToken.transfer(msg.sender, profit), "Profit transfer failed");
        } else {
            require(option.strike > currentPrice, "Not profitable");
            uint256 profit = option.strike - currentPrice;
            require(underlyingToken.transfer(msg.sender, profit), "Profit transfer failed");
        }
        
        option.exercised = true;
        emit OptionExercised(optionId);
    }
    
    function closeOption(uint256 optionId) external  {
        Option storage option = options[optionId];
        require(msg.sender == option.writer, "Not option writer");
        require(!option.exercised, "Already exercised");
        require(!option.closed, "Already closed");
        
        if (option.holder != address(0)) {
            require(quoteToken.transfer(option.holder, option.premium), "Premium refund failed");
        }
        
        if (option.isCall) {
            require(quoteToken.transfer(msg.sender, option.collateral), "Collateral return failed");
        } else {
            require(underlyingToken.transfer(msg.sender, option.collateral), "Collateral return failed");
        }
        
        option.closed = true;
        emit OptionClosed(optionId);
    }
    
    function getCurrentPrice() public view returns (uint256) {
        // In production, this would fetch from an oracle
        return 1500e18; // Example fixed price for testing
    }
}

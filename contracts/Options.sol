// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IPriceFeed {
    function getLatestPrice() external view returns (int256);
    function setPrice(int256 _price) external;
}

contract MockPriceFeed is IPriceFeed {
    int256 private price;
    address private owner;

    constructor() {
        owner = msg.sender;
        price = 3212 * 10**8; // Default price from screenshot
    }

    function getLatestPrice() external view returns (int256) {
        return price;
    }

    function setPrice(int256 _price) external {
        require(msg.sender == owner, "Not authorized");
        price = _price;
    }
}

interface IOptionsMarket {
    enum OptionType { CALL, PUT }
    
    struct Option {
        uint256 strike;
        uint256 maturity;
        OptionType optionType;
        uint256 premium;
        address writer;
        address holder;
        bool exercised;
        bool cancelled;
    }

    event OptionCreated(
        uint256 indexed optionId,
        address indexed writer,
        uint256 strike,
        uint256 maturity,
        OptionType optionType,
        uint256 premium
    );
    
    event OptionExercised(uint256 indexed optionId, address indexed holder);
    event OptionCancelled(uint256 indexed optionId);
}

contract OptionsMarket is IOptionsMarket, ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    IERC20 public immutable stETH;
    IPriceFeed public immutable priceFeed;
    uint256 public constant BLOCKS_PER_DAY = 7200;
    
    mapping(uint256 => Option) public options;
    uint256 public nextOptionId;
    
    uint256 public protocolFeePercent = 0.3e18;
    uint256 public minimumPremium = 0.01 ether;
    uint256 public maximumPremium = 100 ether;
    
    mapping(address => uint256) public writerCollateral;
    mapping(uint256 => uint256) public optionCollateral;

    constructor(
        address _stETH,
        address _priceFeed
    ) {
        require(_stETH != address(0), "Invalid stETH address");
        require(_priceFeed != address(0), "Invalid price feed address");
        
        stETH = IERC20(_stETH);
        priceFeed = IPriceFeed(_priceFeed);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    function createOption(
        uint256 strike,
        uint256 maturityBlocks,
        OptionType optionType,
        uint256 premium
    ) external payable  nonReentrant whenNotPaused {
       
        // require(maturityBlocks >= BLOCKS_PER_DAY, "Maturity too short");
        // require(maturityBlocks <= BLOCKS_PER_DAY * 30, "Maturity too long");
        
        uint256 collateralRequired = _calculateCollateral(
            strike,
            optionType
        );
        
        if (optionType == OptionType.CALL) {
            stETH.safeTransferFrom(msg.sender, address(this), collateralRequired);
        } else {
            require(
                msg.value >= collateralRequired,
                "Insufficient collateral"
            );
        }
        
        uint256 optionId = nextOptionId++;
        options[optionId] = Option({
            strike: strike,
            maturity: block.number + maturityBlocks,
            optionType: optionType,
            premium: premium,
            writer: msg.sender,
            holder: address(0),
            exercised: false,
            cancelled: false
        });
        
        optionCollateral[optionId] = collateralRequired;
        writerCollateral[msg.sender] += collateralRequired;
        
        emit OptionCreated(
            optionId,
            msg.sender,
            strike,
            block.number + maturityBlocks,
            optionType,
            premium
        );
    }

    function purchaseOption(uint256 optionId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        Option storage option = options[optionId];
        require(option.holder == address(0), "Option already purchased");
        require(!option.cancelled, "Option cancelled");
        require(block.number < option.maturity, "Option expired");
        
        stETH.safeTransferFrom(msg.sender, option.writer, option.premium);
        option.holder = msg.sender;
    }

    function exerciseOption(uint256 optionId)
        external
        nonReentrant
        whenNotPaused
    {
        Option storage option = options[optionId];
        require(option.holder == msg.sender, "Not option holder");
        require(!option.exercised, "Already exercised");
        require(!option.cancelled, "Option cancelled");
        require(block.number <= option.maturity, "Option expired");
        
        int256 price = priceFeed.getLatestPrice();
        require(price > 0, "Invalid price");
        
        uint256 currentPrice = uint256(price);
        
        if (option.optionType == OptionType.CALL) {
            require(currentPrice > option.strike, "Not profitable");
            uint256 profit = currentPrice - option.strike;
            stETH.safeTransfer(msg.sender, profit);
        } else {
            require(currentPrice < option.strike, "Not profitable");
            uint256 profit = option.strike - currentPrice;
            require(address(this).balance >= profit, "Insufficient balance");
            payable(msg.sender).transfer(profit);
        }
        
        option.exercised = true;
        emit OptionExercised(optionId, msg.sender);
    }

    function cancelOption(uint256 optionId)
        external
        nonReentrant
    {
        Option storage option = options[optionId];
        require(option.writer == msg.sender, "Not option writer");
        require(!option.exercised, "Already exercised");
        require(!option.cancelled, "Already cancelled");
        require(option.holder == address(0), "Option purchased");
        
        uint256 collateral = optionCollateral[optionId];
        writerCollateral[msg.sender] -= collateral;
        
        if (option.optionType == OptionType.CALL) {
            stETH.safeTransfer(msg.sender, collateral);
        } else {
            payable(msg.sender).transfer(collateral);
        }
        
        option.cancelled = true;
        emit OptionCancelled(optionId);
    }

    function _calculateCollateral(
        uint256 strike,
        OptionType optionType
    ) internal pure returns (uint256) {
        if (optionType == OptionType.CALL) {
            return strike * 1e18 / 1e8;
        } else {
            return strike;
        }
    }

    function setProtocolFee(uint256 _newFee) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(_newFee <= 0.1e18, "Fee too high");
        protocolFeePercent = _newFee;
    }
    
    function setPremiumLimits(
        uint256 _min,
        uint256 _max
    ) external onlyRole(ADMIN_ROLE) {
        require(_min < _max, "Invalid limits");
        minimumPremium = _min;
        maximumPremium = _max;
    }
    
    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }
    
    function getOption(uint256 optionId)
        external
        view
        returns (Option memory)
    {
        return options[optionId];
    }
    
    function getLatestPrice() external view returns (uint256) {
        int256 price = priceFeed.getLatestPrice();
        require(price > 0, "Invalid price");
        return uint256(price);
    }
    
    receive() external payable {}
}

contract OptionsFactory {
    event MarketCreated(address indexed market, address indexed asset);
    
    function createMarket(
        address asset,
        address priceFeed
    ) external returns (address) {
        OptionsMarket market = new OptionsMarket(
            asset,
            priceFeed
        );
        
        emit MarketCreated(address(market), asset);
        return address(market);
    }
}
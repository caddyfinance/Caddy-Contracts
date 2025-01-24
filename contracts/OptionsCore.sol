pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./CollateralManager.sol";
import "./interfaces/IOptionsCore.sol";

contract OptionsCore is IOptionsCore, CollateralManager {
    AggregatorV3Interface public immutable priceFeed;
    mapping(uint256 => Option) public options;
    uint256 public nextOptionId;

    uint256 public constant MIN_DURATION = 1 days;
    uint256 public constant MAX_DURATION = 30 days;

    event OptionCreated(
        uint256 indexed optionId,
        address writer,
        uint256 amount,
        uint256 strikePrice,
        uint256 premium,
        uint256 expiration,
        OptionType optionType
    );
    event OptionPurchased(uint256 indexed optionId, address buyer, uint256 premium);
    event OptionExercised(uint256 indexed optionId, address buyer, uint256 profit);
    event OptionExpired(uint256 indexed optionId);
    event OptionCancelled(uint256 indexed optionId);

    constructor(address _collateralToken, address _priceFeed) 
        CollateralManager(_collateralToken) 
    {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    function createOption(
        uint256 amount,
        uint256 strikePrice,
        uint256 premium,
        uint256 duration,
        OptionType optionType
    ) external override nonReentrant returns (uint256) {
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "Invalid duration");
        require(getAvailableCollateral(msg.sender) >= amount, "Insufficient collateral");

        uint256 optionId = nextOptionId++;
        uint256 expiration = block.timestamp + duration;

        options[optionId] = Option({
            writer: msg.sender,
            buyer: address(0),
            amount: amount,
            strikePrice: strikePrice,
            premium: premium,
            expiration: expiration,
            optionType: optionType,
            state: OptionState.ACTIVE
        });

        emit OptionCreated(
            optionId,
            msg.sender,
            amount,
            strikePrice,
            premium,
            expiration,
            optionType
        );
        return optionId;
    }

    function purchaseOption(uint256 optionId) external override payable nonReentrant {
        Option storage option = options[optionId];
        require(option.state == OptionState.ACTIVE, "Option not active");
        require(block.timestamp < option.expiration, "Option expired");
        require(msg.value == option.premium, "Incorrect premium amount");
        require(option.buyer == address(0), "Option already purchased");

        option.buyer = msg.sender;
        payable(option.writer).transfer(msg.value);

        emit OptionPurchased(optionId, msg.sender, option.premium);
    }

    function exerciseOption(uint256 optionId) external override payable nonReentrant {
        Option storage option = options[optionId];
        require(option.state == OptionState.ACTIVE, "Option not active");
        require(option.buyer == msg.sender, "Not option buyer");
        require(block.timestamp < option.expiration, "Option expired");

        (, int256 currentPrice,,,) = priceFeed.latestRoundData();
        uint256 price = uint256(currentPrice);

        uint256 profit;
        if (option.optionType == OptionType.CALL) {
            require(price >= option.strikePrice, "Price below strike price");
            require(msg.value == option.amount * option.strikePrice / 1e18, "Incorrect ETH amount");
            
            profit = (price - option.strikePrice) * option.amount / 1e18;
            option.state = OptionState.EXERCISED;
            require(collateralToken.transfer(msg.sender, option.amount), "Transfer failed");
            payable(option.writer).transfer(msg.value);
            
        } else {
            require(price <= option.strikePrice, "Price above strike price");
            require(msg.value == option.amount, "Incorrect ETH amount");
            
            profit = (option.strikePrice - price) * option.amount / 1e18;
            option.state = OptionState.EXERCISED;
            uint256 payoutAmount = option.amount * option.strikePrice / 1e18;
            require(collateralToken.transfer(option.writer, option.amount), "Transfer failed");
            payable(msg.sender).transfer(payoutAmount);
        }

        emit OptionExercised(optionId, msg.sender, profit);
    }

    function expireOption(uint256 optionId) external override {
        Option storage option = options[optionId];
        require(option.state == OptionState.ACTIVE, "Option not active");
        require(block.timestamp >= option.expiration, "Option not expired");

        option.state = OptionState.EXPIRED;
        emit OptionExpired(optionId);
    }

    function cancelOption(uint256 optionId) external override {
        Option storage option = options[optionId];
        require(msg.sender == option.writer, "Not option writer");
        require(option.state == OptionState.ACTIVE, "Option not active");
        require(option.buyer == address(0), "Option already purchased");

        option.state = OptionState.CANCELLED;
        emit OptionCancelled(optionId);
    }

    function getOptionDetails(uint256 optionId) external override view returns (
        address writer,
        address buyer,
        uint256 amount,
        uint256 strikePrice,
        uint256 premium,
        uint256 expiration,
        OptionType optionType,
        OptionState state
    ) {
        Option storage option = options[optionId];
        return (
            option.writer,
            option.buyer,
            option.amount,
            option.strikePrice,
            option.premium,
            option.expiration,
            option.optionType,
            option.state
        );
    }

    function getLockedCollateral(address user) internal view override returns (uint256) {
        uint256 lockedCollateral = 0;
        for (uint256 i = 0; i < nextOptionId; i++) {
            Option storage option = options[i];
            if (option.writer == user && option.state == OptionState.ACTIVE) {
                lockedCollateral += option.amount;
            }
        }
        return lockedCollateral;
    }
}
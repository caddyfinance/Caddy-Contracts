pragma solidity ^0.8.17;

interface IOptionsCore {
    enum OptionType { CALL, PUT }
    enum OptionState { ACTIVE, EXERCISED, EXPIRED, CANCELLED }

    struct Option {
        address writer;
        address buyer;
        uint256 amount;
        uint256 strikePrice;
        uint256 premium;
        uint256 expiration;
        OptionType optionType;
        OptionState state;
    }

    function depositCollateral(uint256 amount) external;
    function withdrawCollateral(uint256 amount) external;
    function createOption(
        uint256 amount,
        uint256 strikePrice,
        uint256 premium,
        uint256 duration,
        OptionType optionType
    ) external returns (uint256);
    function purchaseOption(uint256 optionId) external payable;
    function exerciseOption(uint256 optionId) external payable;
    function expireOption(uint256 optionId) external;
    function cancelOption(uint256 optionId) external;
    function getOptionDetails(uint256 optionId) external view returns (
        address writer,
        address buyer,
        uint256 amount,
        uint256 strikePrice,
        uint256 premium,
        uint256 expiration,
        OptionType optionType,
        OptionState state
    );
}
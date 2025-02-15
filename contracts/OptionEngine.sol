// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./OptionPosition.sol";
contract OptionsEngine is ReentrancyGuard, AccessControl {
    using SafeMath for uint256;

    OptionPosition public immutable optionPosition;
    
    uint256 public constant COLLATERAL_RATIO = 12000; // 120%
    uint256 public constant MIN_DURATION = 1 ;
    uint256 public constant MAX_DURATION = 10 ;

    mapping(uint256 => uint256) public lockedCollateral;
    mapping(address => uint256) public userCollateral;

    event PositionOpened(
        uint256 indexed tokenId,
        address indexed trader,
        uint256 premium,
        bool isLong,
        bool isCall
    );

    event PositionExercised(
        uint256 indexed tokenId,
        address indexed trader,
        uint256 amount,
        uint256 settlementAmount
    );

    constructor(address _optionPosition) {
        optionPosition = OptionPosition(_optionPosition);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function openPosition(
        address underlying,
        uint256 amount,
        uint256 strikePrice,
        uint256 expiry,
        OptionPosition.PositionType positionType
    ) external payable nonReentrant returns (uint256) {
        require(expiry > block.timestamp + MIN_DURATION, "Expiry too soon");
        require(expiry <= block.timestamp + MAX_DURATION, "Expiry too far");
        require(amount > 0, "Invalid amount");
        
        uint256 premium = optionPosition.calculatePremium(amount, strikePrice, positionType);

        if (positionType == OptionPosition.PositionType.LONG_CALL || 
            positionType == OptionPosition.PositionType.LONG_PUT) {
            require(msg.value >= premium, "Insufficient premium");
        } else if (positionType == OptionPosition.PositionType.SHORT_CALL) {
            require(
                IERC20(underlying).transferFrom(msg.sender, address(this), amount),
                "Collateral transfer failed"
            );
        } else { // SHORT_PUT
            uint256 collateral = amount.mul(strikePrice).mul(COLLATERAL_RATIO).div(10000);
            require(msg.value >= collateral, "Insufficient collateral");
        }

        uint256 tokenId = optionPosition.mint(
            msg.sender,
            underlying,
            address(0),
            strikePrice,
            expiry,
            amount,
            positionType
        );

        bool isLong = positionType == OptionPosition.PositionType.LONG_CALL || 
                     positionType == OptionPosition.PositionType.LONG_PUT;
        bool isCall = positionType == OptionPosition.PositionType.LONG_CALL || 
                     positionType == OptionPosition.PositionType.SHORT_CALL;

        emit PositionOpened(tokenId, msg.sender, premium, isLong, isCall);

        return tokenId;
    }

    function exercise(uint256 tokenId) external payable nonReentrant {
        (
            address underlying,
            ,  // strikeAsset
            uint256 strikePrice,
            uint256 expiry,
            uint256 amount,
            OptionPosition.PositionType positionType,
            bool isSettled
        ) = optionPosition.getPosition(tokenId);
        
        require(!isSettled, "Position already settled");
        require(block.timestamp >= expiry, "Not yet expired");
        require(optionPosition.ownerOf(tokenId) == msg.sender, "Not position owner");

        uint256 settlementAmount;

        if (positionType == OptionPosition.PositionType.LONG_CALL) {
            settlementAmount = amount.mul(strikePrice);
            require(msg.value >= settlementAmount, "Insufficient payment");
            IERC20(underlying).transfer(msg.sender, amount);
        } else if (positionType == OptionPosition.PositionType.LONG_PUT) {
            settlementAmount = amount.mul(strikePrice);
            require(
                IERC20(underlying).transferFrom(msg.sender, address(this), amount),
                "Transfer failed"
            );
            payable(msg.sender).transfer(settlementAmount);
        }

        optionPosition.setSettled(tokenId);
        emit PositionExercised(tokenId, msg.sender, amount, settlementAmount);
    }

    receive() external payable {}
    fallback() external payable {}
}
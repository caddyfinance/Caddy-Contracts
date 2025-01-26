// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract OptionPosition is ERC721, AccessControl {
    using SafeMath for uint256;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    enum PositionType { LONG_CALL, SHORT_CALL, LONG_PUT, SHORT_PUT }
    
    struct Position {
        address underlying;
        address strikeAsset;
        uint256 strikePrice;
        uint256 expiry;
        uint256 amount;
        PositionType positionType;
        bool isSettled;
    }

    mapping(uint256 => Position) public positions;
    uint256 private _nextTokenId;

    event PositionOpened(
        uint256 indexed tokenId,
        address indexed trader,
        PositionType positionType,
        uint256 amount,
        uint256 strikePrice
    );

    constructor() ERC721("Options Position", "OPT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function mint(
        address to,
        address underlying,
        address strikeAsset,
        uint256 strikePrice,
        uint256 expiry,
        uint256 amount,
        PositionType positionType
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        positions[tokenId] = Position({
            underlying: underlying,
            strikeAsset: strikeAsset,
            strikePrice: strikePrice,
            expiry: expiry,
            amount: amount,
            positionType: positionType,
            isSettled: false
        });

        emit PositionOpened(
            tokenId,
            to,
            positionType,
            amount,
            strikePrice
        );
        
        return tokenId;
    }

    function setSettled(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        positions[tokenId].isSettled = true;
    }

    function getPosition(uint256 tokenId) external view returns (
        address underlying,
        address strikeAsset,
        uint256 strikePrice,
        uint256 expiry,
        uint256 amount,
        PositionType positionType,
        bool isSettled
    ) {
        Position storage position = positions[tokenId];
        return (
            position.underlying,
            position.strikeAsset,
            position.strikePrice,
            position.expiry,
            position.amount,
            position.positionType,
            position.isSettled
        );
    }

    function calculatePremium(
        uint256 amount,
        uint256 strikePrice,
        OptionPosition.PositionType positionType
    ) public view returns (uint256) {
        bool isCall = positionType == OptionPosition.PositionType.LONG_CALL || 
                     positionType == OptionPosition.PositionType.SHORT_CALL;
                     
        // Current ETH price in USD (this should ideally come from an oracle)
        uint256 currentPrice = 2000; // Example: $2000 per ETH
        
        // Simplified volatility (30%)
        uint256 volatility = 30;
        
        // Time to expiry in days (assuming 30 days)
        uint256 timeToExpiry = 30;
        
        uint256 premium;
        if (isCall) {
            if (currentPrice > strikePrice) {
                // In the money
                premium = (currentPrice.sub(strikePrice)).mul(80).div(100);
            } else {
                // Out of the money
                premium = (strikePrice.sub(currentPrice)).mul(20).div(100);
            }
        } else {
            if (strikePrice > currentPrice) {
                // In the money
                premium = (strikePrice.sub(currentPrice)).mul(80).div(100);
            } else {
                // Out of the money
                premium = (currentPrice.sub(strikePrice)).mul(20).div(100);
            }
        }
        
        // Add time value: longer time = higher premium
        premium = premium.add(timeToExpiry.mul(currentPrice).div(365).mul(volatility).div(100));
        
        // Convert premium to wei first (1 USD = 1e18 wei)
        premium = premium.mul(1e18);
        
        // Now scale by amount (which is in wei)
        return premium.mul(amount).div(currentPrice.mul(1e18));
    }

    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}

contract OptionsEngine is ReentrancyGuard, AccessControl {
    using SafeMath for uint256;

    OptionPosition public immutable optionPosition;
    
    uint256 public constant COLLATERAL_RATIO = 12000; // 120%
    uint256 public constant MIN_DURATION = 1 days;
    uint256 public constant MAX_DURATION = 90 days;

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

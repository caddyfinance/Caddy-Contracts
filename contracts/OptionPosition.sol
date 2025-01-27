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
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");
    
    uint256 public currentPrice = 2000; // Default price in USD
    
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

    event PriceUpdated(
        uint256 oldPrice,
        uint256 newPrice,
        address updater
    );

    constructor() ERC721("Options Position", "OPT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PRICE_UPDATER_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function updatePrice(uint256 newPrice) external onlyRole(PRICE_UPDATER_ROLE) {
        require(newPrice > 0, "Price must be greater than 0");
        uint256 oldPrice = currentPrice;
        currentPrice = newPrice;
        emit PriceUpdated(oldPrice, newPrice, msg.sender);
    }

    function getCurrentPrice() external view returns (uint256) {
        return currentPrice;
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
                     
        // Use the current price from state
        uint256 currentPriceValue = currentPrice;
        
        // Simplified volatility (30%)
        uint256 volatility = 30;
        
        // Time to expiry in days (assuming 30 days)
        uint256 timeToExpiry = 30;
        
        uint256 premium;
        if (isCall) {
            if (currentPriceValue > strikePrice) {
                // In the money
                premium = (currentPriceValue.sub(strikePrice)).mul(80).div(100);
            } else {
                // Out of the money
                premium = (strikePrice.sub(currentPriceValue)).mul(20).div(100);
            }
        } else {
            if (strikePrice > currentPriceValue) {
                // In the money
                premium = (strikePrice.sub(currentPriceValue)).mul(80).div(100);
            } else {
                // Out of the money
                premium = (currentPriceValue.sub(strikePrice)).mul(20).div(100);
            }
        }
        
        // Add time value: longer time = higher premium
        premium = premium.add(timeToExpiry.mul(currentPriceValue).div(365).mul(volatility).div(100));
        
        // Convert premium to wei first (1 USD = 1e18 wei)
        premium = premium.mul(1e18);
        
        // Now scale by amount (which is in wei)
        return premium.mul(amount).div(currentPriceValue.mul(1e18));
    }

    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}



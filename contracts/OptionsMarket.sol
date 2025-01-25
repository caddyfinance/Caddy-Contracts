// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IOptionsMarket.sol";
import "./interfaces/IPriceFeed.sol";

contract OptionsMarket is IOptionsMarket, ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    IERC20 public immutable stETH;
    IPriceFeed public immutable priceFeed;

    constructor(address _stETH, address _priceFeed) {
        require(_stETH != address(0), "Invalid stETH address");
        require(_priceFeed != address(0), "Invalid price feed address");
        
        stETH = IERC20(_stETH);
        priceFeed = IPriceFeed(_priceFeed);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ... [Rest of the OptionsMarket contract code remains the same]
} 
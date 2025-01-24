// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// File: contracts/interfaces/IOptionPricing.sol
interface IOptionPricing {
    function getOptionPrice(
        uint256 strike,
        uint256 timeToExpiry,
        uint256 volatility,
        uint256 currentPrice,
        bool isCall
    ) external pure returns (uint256);
}

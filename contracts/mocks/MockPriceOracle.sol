// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockPriceOracle {
    mapping(address => uint256) private prices;
    mapping(address => uint256) private volatilities;

    function setAssetPrice(address asset, uint256 price) external {
        prices[asset] = price;
    }

    function setVolatility(address asset, uint256 volatility) external {
        volatilities[asset] = volatility;
    }

    function getAssetPrice(address asset) external view returns (uint256) {
        return prices[asset];
    }

    function getVolatility(address asset) external view returns (uint256) {
        return volatilities[asset];
    }
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./OptionsMarket.sol";

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
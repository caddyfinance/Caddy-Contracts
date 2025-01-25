// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interfaces/IPriceFeed.sol";

contract MockPriceFeed is IPriceFeed {
    int256 private price;
    address private owner;

    constructor() {
        owner = msg.sender;
        price = 3212 * 10**8;
    }

    function getLatestPrice() external view returns (int256) {
        return price;
    }

    function setPrice(int256 _price) external {
        require(msg.sender == owner, "Not authorized");
        price = _price;
    }
} 
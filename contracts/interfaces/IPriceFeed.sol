// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IPriceFeed {
    function getLatestPrice() external view returns (int256);
    function setPrice(int256 _price) external;
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOptionVault {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getCollateralBalance() external view returns (uint256);
}
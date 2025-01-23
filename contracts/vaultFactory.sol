// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./AutomatedOptionsVault.sol";

contract VaultFactory {
    mapping(address => address[]) public userVaults;
    event VaultCreated(address vault, address owner, address asset);
    
    function createVault(
        address asset,
        address priceFeed,
        address usdToken
    ) external returns (address) {
        AutomatedOptionsVault vault = new AutomatedOptionsVault(
            asset,
            priceFeed,
            usdToken
        );
        
        userVaults[msg.sender].push(address(vault));
        emit VaultCreated(address(vault), msg.sender, asset);
        return address(vault);
    }
    
    function getUserVaults(address user) external view returns (address[] memory) {
        return userVaults[user];
    }
}
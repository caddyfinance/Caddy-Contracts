// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockOptionController {
    uint256 public pnlToReturn;

    function setPnl(uint256 _pnl) external {
        pnlToReturn = _pnl;
    }

    function createOption(
        address asset,
        uint256 strike,
        uint256 expiry,
        bool isCall
    ) external pure returns (uint256) {
        return 1;
    }
    
    function settleOption(uint256 optionId) external view returns (uint256) {
        return pnlToReturn;
    }
} 
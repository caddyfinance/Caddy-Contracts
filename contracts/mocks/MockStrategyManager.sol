// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockStrategyManager {
    bool public validationResponse;
    uint256 public optionIdToReturn;

    function setValidationResponse(bool _response) external {
        validationResponse = _response;
    }

    function setOptionId(uint256 _optionId) external {
        optionIdToReturn = _optionId;
    }

    function validateStrategy(
        uint256 strategyId,
        address asset,
        uint256 amount
    ) external view returns (bool) {
        return validationResponse;
    }
    
    function executeStrategy(
        uint256 strategyId,
        address asset,
        uint256 amount
    ) external view returns (uint256) {
        return optionIdToReturn;
    }
} 
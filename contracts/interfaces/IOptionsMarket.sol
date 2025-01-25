// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IOptionsMarket {
    enum OptionType { CALL, PUT }
    
    struct Option {
        uint256 strike;
        uint256 maturity;
        OptionType optionType;
        uint256 premium;
        address writer;
        address holder;
        bool exercised;
        bool cancelled;
    }

    event OptionCreated(
        uint256 indexed optionId,
        address indexed writer,
        uint256 strike,
        uint256 maturity,
        OptionType optionType,
        uint256 premium
    );
    
    event OptionExercised(uint256 indexed optionId, address indexed holder);
    event OptionCancelled(uint256 indexed optionId);
} 
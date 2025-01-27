# Options Trading Smart Contracts

This repository contains smart contracts for a decentralized options trading platform on Ethereum. The platform allows users to create, buy, and exercise options contracts for stETH.

## Contracts

### Core Contracts

- **OptionsMarket.sol**: Main contract for creating and managing options
- **OptionsFactory.sol**: Factory contract for deploying new options markets
- **MockStETH.sol**: Mock ERC20 token representing stETH (for testing)
- **MockPriceFeed.sol**: Mock price feed contract (for testing)

### Interfaces

- **IOptionsMarket.sol**: Interface for the main options market functionality
- **IPriceFeed.sol**: Interface for price feed implementations

## Setup

1. Clone the repository 

```bash
git clone https://github.com/yourusername/options-trading-contracts.git
cd options-trading-contracts
```

2. Install dependencies

```bash
npm install
```

3. Deploy contracts

```bash
npx hardhat run scripts/deploy.js
```


4. Verify contracts on Etherscan

```bash
npx hardhat verify --network <network> <contract_address>
```



## Deployed Contracts (Sepolia)

The following contracts have been deployed and verified on Sepolia testnet:

- **MockStETH**: [0x5241e6606c92700d7A2745cEeeD81465692B3F0b](https://sepolia.etherscan.io/address/0x5241e6606c92700d7A2745cEeeD81465692B3F0b#code)
- **MockPriceFeed**: [0xABA35C0bfD3A3c114573754ba9BE5D14613b85E1](https://sepolia.etherscan.io/address/0xABA35C0bfD3A3c114573754ba9BE5D14613b85E1#code)
- **OptionsMarket**: [0x010d88E1b4821a814C92a283416e2b7B56a5dF08](https://sepolia.etherscan.io/address/0x010d88E1b4821a814C92a283416e2b7B56a5dF08#code)
- **OptionsFactory**: [0x60B87eeBbee2968e5Bb87CaeAc5B3DF04F1A058B](https://sepolia.etherscan.io/address/0x60B87eeBbee2968e5Bb87CaeAc5B3DF04F1A058B#code)

## Contract Verification Results
| Contract | Status | Address |
|----------|---------|----------|
| MockStETH | Already verified | `0x5241e6606c92700d7A2745cEeeD81465692B3F0b` |
| MockPriceFeed | Successfully verified | `0xABA35C0bfD3A3c114573754ba9BE5D14613b85E1` |
| OptionsMarket | Successfully verified | `0x010d88E1b4821a814C92a283416e2b7B56a5dF08` |
| OptionsFactory | Successfully verified | `0x60B87eeBbee2968e5Bb87CaeAc5B3DF04F1A058B` |



## Features

- Create CALL and PUT options for stETH
- Set custom strike prices and maturities

- Exercise options when profitable
- Cancel unexercised options
- Admin controls for protocol fees and limits
- Emergency functions for contract management

## Security Features

- ReentrancyGuard for all state-changing functions
- Pausable functionality for emergency stops
- Role-based access control for admin functions
- SafeERC20 for token transfers
- Comprehensive input validation

## Testing

To run the tests:

```bash
npx hardhat test
```



## Deployed Contracts (Sepolia)

Deployment Summary
=================
MockERC20: 0xb2d0A4C57d541922A91D0E2fB714Fd48eAcA295B
OptionPosition: 0x8d8240813E4A8FC849954E2827d9b45f43d30291
OptionsEngine: 0x0D6C824418951D632f6003B47474c51fC1421765
Deployer: 0x3ae7F2767111D8700F82122A373792B99d605749
Current Price: 2000n
Deployer Token Balance: 1000000.0


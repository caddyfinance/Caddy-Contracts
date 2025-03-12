# Options Protocol Technical Documentation

## Overview
The Options Protocol is a decentralized options trading platform that supports four basic option types: Long Call, Short Call, Long Put, and Short Put. The protocol is built on two main smart contracts: OptionsEngine and OptionPosition.

## Contract Architecture

### OptionsEngine.sol
The main contract that handles all options trading logic.

#### Key Features
- Position creation and management
- Premium handling
- Collateral management
- Exercise mechanics
- Premium withdrawal system

#### Constants 

COLLATERAL_RATIO = 12000 // 120% collateralization
MIN_DURATION = 1
MAX_DURATION = 1000


#### Core Functions

1. **openPosition**

function openPosition(
address underlying,
uint256 amount,
uint256 strikePrice,
uint256 expiry,
OptionPosition.PositionType positionType,
uint256 premium,
uint256 walletType
) external nonReentrant returns (uint256)


- Creates new option positions
- Handles collateral and premium transfers
- Returns a unique tokenId for the position

2. **exercise**


function exercise(uint256 tokenId) external payable nonReentrant

- Allows exercise of options at or after expiry
- Handles settlement calculations and transfers
- Supports both call and put options

### OptionPosition.sol
NFT contract that represents option positions.

#### Key Features
- ERC721 implementation for option positions
- Role-based access control
- Position tracking and management
- Premium calculation

#### Position Types


enum PositionType {
LONG_CALL,
SHORT_CALL,
LONG_PUT,
SHORT_PUT
}



## Position Mechanics

### Long Call
- Buyer pays premium upfront
- Right to buy underlying at strike price
- Exercise requires ETH payment equal to (amount * strikePrice)
- Receives underlying tokens upon exercise

### Short Call
- Writer deposits underlying tokens as collateral
- Receives premium
- Collateral locked until expiry or exercise
- Must deliver underlying if exercised

### Long Put
- Buyer pays premium upfront
- Right to sell underlying at strike price
- Must have underlying tokens to exercise
- Receives ETH payment upon exercise

### Short Put
- Writer deposits collateral (120% of strike * amount)
- Receives premium
- Must accept underlying tokens if exercised
- Collateral returned if not exercised

## Premium and Collateral Management

### Premium Handling
- Premiums are paid upfront by long position holders
- Stored in contract until withdrawal by position writers
- Withdrawal only allowed after expiry or settlement

### Collateral Requirements
1. Short Call: 100% of underlying tokens
2. Short Put: 120% of (strike price * amount)

## Security Features

### Access Control
- Role-based access using OpenZeppelin's AccessControl
- MINTER_ROLE for position creation
- Owner-only functions for emergency controls

### Safety Mechanisms
- ReentrancyGuard for all state-changing functions
- Strict validation of expiry times
- Collateral checks before position creation
- Settlement verification

## Events

```
event PositionOpened(
uint256 tokenId,
address trader,
uint256 premium,
uint256 collateral,
uint256 strikePrice,
uint256 expiry,
OptionPosition.PositionType positionType,
address underlying,
bool isSettled,
uint256 walletType
);
event PositionExercised(
uint256 indexed tokenId,
address indexed trader,
uint256 amount,
uint256 settlementAmount
);
event PremiumWithdrawn(
uint256 indexed tokenId,
address indexed writer,
uint256 amount
);
```



## Integration Guide

### Position Creation


```
const params = {
underlying: tokenAddress,
amount: parseEther("0.1"),
strikePrice: parseEther("0.1"),
expiry: currentTime + 86400, // 24 hours
positionType: 0, // LONG_CALL
premium: parseEther("0.01"),
walletType: 0
};
await optionsEngine.openPosition(params);
```




### Exercise


```
await optionsEngine.exercise(tokenId, {
value: paymentAmount // For call options
});

```


## Testing

The protocol includes comprehensive tests covering:
- Position creation for all types
- Exercise mechanics
- Premium withdrawal
- Collateral management
- Error cases
- Access control

Run tests using:


```
npm run test
```



## Deployment

Deploy using Hardhat Ignition:


```
npm run deploy:monad 
```




## Security Considerations

1. **Collateral Management**
   - Always verify collateral calculations
   - Monitor collateral ratios
   - Implement emergency withdrawal mechanisms

2. **Price Oracle**
   - Current implementation uses fixed price
   - Consider integrating with reliable price feeds

3. **Access Control**
   - Strict role management
   - Owner capabilities limited to emergency functions

4. **Gas Optimization**
   - Batch operations where possible
   - Efficient storage usage
   - Optimized calculations

## Future Improvements

1. **Oracle Integration**
   - Add Chainlink price feeds
   - Implement dynamic pricing

2. **Advanced Features**
   - American-style options
   - Partial exercise
   - Position combining

3. **Risk Management**
   - Dynamic collateral ratios
   - Liquidation mechanisms
   - Insurance pool

# Aave V3 Deployments

[![npm (scoped)](https://img.shields.io/npm/v/@aave/deploy-v3)](https://www.npmjs.com/package/@aave/deploy-v3)

This Node.js repository contains the configuration and deployment scripts for the Aave V3 protocol core and periphery contracts. The repository makes use of `hardhat` and `hardhat-deploy` tools to facilitate the deployment of Aave V3 protocol.

## Requirements

- Node.js >= 16
- Alchemy key
  - If you use a custom RPC node, you can change the default RPC provider URL at [./helpers/hardhat-config-helpers.ts:25](./helpers/hardhat-config-helpers.ts).
- Etherscan API key _(Optional)_

## Getting Started

1. Install Node.JS dependencies:

   ```
   npm i
   ```

2. Compile contracts before running any other command, to generate Typechain TS typings:

   ```
   npm run compile
   ```

## How to deploy Aave V3 in testnet network

To deploy Aave V3 in a Testnet network, copy the `.env.example` into a `.env` file, and fill the environment variables `MNEMONIC`, and `ALCHEMY_KEY`.

```
cp .env.example .env
```

Edit the `.env` file to fill the environment variables `MNEMONIC`, `ALCHEMY_KEY` and `MARKET_NAME`. You can check all possible pool configurations in this [file](https://github.com/aave/aave-v3-deploy/blob/09e91b80aff219da80f35a9fc55dafc5d698b574/helpers/market-config-helpers.ts#L95).

```
nano .env
```

Run the deployments scripts and specify which network & aave market configs you wish to deploy.

```
HARDHAT_NETWORK=goerli npx hardhat deploy
```

## How to deploy Aave V3 in fork network

You can use the environment variable `FORK` with the network name to deploy into a fork.

```
FORK=main MARKET_NAME=Aave npx hardhat deploy
```

## How to integrate in your Hardhat project

You can install the `@aave/deploy-v3` package in your Hardhat project to be able to import deployments with `hardhat-deploy` and build on top of Aave in local or testnet network.

To make it work, you must install the following packages in your project:

```
npm i --save-dev @aave/deploy-v3 @aave/core-v3 @aave/periphery-v3
```

Then, proceed to load the deploy scripts adding the `externals` field in your Hardhat config file at `hardhat.config.js|ts`.

```
# Content of hardhat.config.ts file

export default hardhatConfig: HardhatUserConfig = {
   {...},
   external: {
    contracts: [
      {
        artifacts: 'node_modules/@aave/deploy-v3/artifacts',
        deploy: 'node_modules/@aave/deploy-v3/dist/deploy',
      },
    ],
  },
}
```

After all is configured, you can run `npx hardhat deploy` to run the scripts or you can also run it programmatically in your tests using fixtures:

```
import {getPoolAddressesProvider} from '@aave/deploy-v3';

describe('Tests', () => {
   before(async () => {
      // Set the MARKET_NAME env var
      process.env.MARKET_NAME = "Aave"

      // Deploy Aave V3 contracts before running tests
      await hre.deployments.fixture(['market', 'periphery-post']);`
   })

   it('Get Pool address from AddressesProvider', async () => {
      const addressesProvider = await getPoolAddressesProvider();

      const poolAddress = await addressesProvider.getPool();

      console.log('Pool', poolAddress);
   })
})

```

## How to verify your contract deployments

```
npx hardhat --network XYZ etherscan-verify --api-key YZX
```

## Project Structure

| Path                  | Description                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| deploy/               | Main deployment scripts dir location                                                                                            |
| ├─ 00-core/           | Core deployment, only needed to run once per network.                                                                           |
| ├─ 01-periphery_pre/  | Periphery contracts deployment, only need to run once per network.                                                              |
| ├─ 02-market/         | Market deployment scripts, depends of Core and Periphery deployment.                                                            |
| ├─ 03-periphery_post/ | Periphery contracts deployment after market is deployed.                                                                        |
| deployments/          | Artifacts location of the deployments, contains the addresses, the abi, solidity input metadata and the constructor parameters. |
| markets/              | Directory to configure Aave markets                                                                                             |
| tasks/                | Hardhat tasks to setup and review market configs                                                                                |
| helpers/              | Utility helpers to manage configs and deployments                                                                               |

## License

Please be aware that [Aave V3](https://github.com/aave/aave-v3-core) is under [BSUL](https://github.com/aave/aave-v3-core/blob/master/LICENSE.md) license as of 27 January 2023 or date specified at v3-license-date.aave.eth. The Licensor hereby grants you the right to copy, modify, create derivative works, redistribute, and make non-production use of the Licensed Work. Any exceptions to this license may be specified by Aave governance. This repository containing the deployment scripts for the Aave V3 smart contracts can only be used for local or testing purposes. If you wish to deploy to a production environment you can reach out to Aave Governance [here](https://governance.aave.com/).




deployed contracts:


Accounts after deployment
========
┌─────────┬──────────────────────────────────┬──────────────────────────────────────────────┬───────────────────────┐
│ (index) │ name                             │ account                                      │ balance               │
├─────────┼──────────────────────────────────┼──────────────────────────────────────────────┼───────────────────────┤
│ 0       │ 'deployer'                       │ '0x3ae7F2767111D8700F82122A373792B99d605749' │ '0.09303286556180465' │
│ 1       │ 'aclAdmin'                       │ '0x3ae7F2767111D8700F82122A373792B99d605749' │ '0.09303286556180465' │
│ 2       │ 'emergencyAdmin'                 │ '0x3ae7F2767111D8700F82122A373792B99d605749' │ '0.09303286556180465' │
│ 3       │ 'poolAdmin'                      │ '0x3ae7F2767111D8700F82122A373792B99d605749' │ '0.09303286556180465' │
│ 4       │ 'addressesProviderRegistryOwner' │ '0x3ae7F2767111D8700F82122A373792B99d605749' │ '0.09303286556180465' │
│ 5       │ 'treasuryProxyAdmin'             │ '0xcBAee4793486f3Df37dbb584F5a3610ff581A614' │ '0.0'                 │
│ 6       │ 'incentivesProxyAdmin'           │ '0xcBAee4793486f3Df37dbb584F5a3610ff581A614' │ '0.0'                 │
│ 7       │ 'incentivesEmissionManager'      │ '0x3ae7F2767111D8700F82122A373792B99d605749' │ '0.09303286556180465' │
│ 8       │ 'incentivesRewardsVault'         │ '0x3ae7F2767111D8700F82122A373792B99d605749' │ '0.09303286556180465' │
└─────────┴──────────────────────────────────┴──────────────────────────────────────────────┴───────────────────────┘

Deployments
===========
┌─────────────────────────────────────────┬──────────────────────────────────────────────┐
│ (index)                                 │ address                                      │
├─────────────────────────────────────────┼──────────────────────────────────────────────┤
│ PoolAddressesProviderRegistry           │ '0x1d9F8351F788278D3E181908cEE14c7F5766157F' │
│ SupplyLogic                             │ '0x10503fF810A0cD452F8Eb0614f67d7d0b43246dd' │
│ BorrowLogic                             │ '0x0d74461fB91fD62579FfC3b30a2F820cf98BD964' │
│ LiquidationLogic                        │ '0xF0bDFa26b572fBF3dEc4f1864fFf29a606e7387e' │
│ EModeLogic                              │ '0xB11905c1DDEbb3B4246B18F6fE97c72013978d7A' │
│ BridgeLogic                             │ '0x1B1B518C3D1ff73E1FB50bca5f960CC964277722' │
│ ConfiguratorLogic                       │ '0x2d42f7bEfE50FD2803cFc6bA8A4dC75568e322E0' │
│ FlashLoanLogic                          │ '0xD9f0021F9423C81123fe53d02aCB16dC9e1302dA' │
│ PoolLogic                               │ '0x9Cab23EB3697294eA52B88D88648FfD487530d6e' │
│ TreasuryProxy                           │ '0x2e42d3B666bB53035A7A5A89FFC89ac6B09a3688' │
│ Treasury-Controller                     │ '0x18b917B1f54E0eeA6d97ADBbF7c945c3Dd94FC5C' │
│ Treasury-Implementation                 │ '0x68Fa63E97B659F3CdFAFbB2FC859b70Fbb8bccC0' │
│ Faucet-Aave                             │ '0xc94193e04A4bFA6d1c497c4f72fe3A726616C51d' │
│ PoolAddressesProvider-Aave              │ '0x19550db79991CF96E4E4120b1c251D9e2736309E' │
│ PoolDataProvider-Aave                   │ '0x6b29F09FE57432F38d8Ca9b49002DD076dC046B3' │
│ DAI-TestnetPriceAggregator-Aave         │ '0x3817307258054Ef8c99f2B899E65168e3Ae11302' │
│ LINK-TestnetPriceAggregator-Aave        │ '0xb556632861036a1b110e64995C4f27345C9Eb97a' │
│ USDC-TestnetPriceAggregator-Aave        │ '0xb209BAAc6C02066C8E9ddb290de67339D358C961' │
│ WBTC-TestnetPriceAggregator-Aave        │ '0xE16b2faa648B86a6361e2d62f9aE5F1Cacc34D6E' │
│ WETH-TestnetPriceAggregator-Aave        │ '0xeF505534adfd816fCfA5b46777B360f0a7c11f3f' │
│ USDT-TestnetPriceAggregator-Aave        │ '0xA163cE318428cfFB4F28f276Ed65Ed28FdA6E89A' │
│ AAVE-TestnetPriceAggregator-Aave        │ '0x9e3d666f041f3Aa0D37F64a34Fc2C9DD97C25d41' │
│ EURS-TestnetPriceAggregator-Aave        │ '0x8392873b609E6aF13BeD189B4F162065a699F8D8' │
│ Pool-Implementation                     │ '0x7516BEd36f6fF2e9f27B325AEe4300EA8B6ae2d2' │
│ PoolConfigurator-Implementation         │ '0xe45B32Ef8C79cd9322D428bAeeC01d8969F9AF4d' │
│ ReservesSetupHelper                     │ '0x9597b11f159aDb556482b280a3790E8826B23d76' │
│ ACLManager-Aave                         │ '0xC4aaAADEf50dd15c408Ad29604F51C7303940dF5' │
│ AaveOracle-Aave                         │ '0x79406D960827C781F3fF5a82dcEa2a955C723d73' │
│ Pool-Proxy-Aave                         │ '0x24432A56857C4d2c96b4BAE22D183DF91268d139' │
│ PoolConfigurator-Proxy-Aave             │ '0x40bD70Dc0E8f25736D81D87507bC239d2a32125f' │
│ EmissionManager                         │ '0x15B3691e0B55FF3505027E47daE7a0D7f413c5d2' │
│ IncentivesV2-Implementation             │ '0xf9bb681b72869300a8851EdD8FaBfE807608Ecf3' │
│ IncentivesProxy                         │ '0x0e76e0196FC7cE5151253Fbc485A8e255fCC1De5' │
│ PullRewardsTransferStrategy             │ '0xB6b61fab22F1946E245645375686e57c4EEa16c4' │
│ AToken-Aave                             │ '0xDbd62Dadfb1984A1501EaE5E9a2EbE451AAa9572' │
│ DelegationAwareAToken-Aave              │ '0xe35653E33d5B9a9bCa3960f2d56EaCD21c750fd6' │
│ StableDebtToken-Aave                    │ '0xd071eF96e365c162085C66E53CD8D41A3284570b' │
│ VariableDebtToken-Aave                  │ '0x6893d3E6ea32c62e547378cD10E2539DC1218203' │
│ ReserveStrategy-rateStrategyVolatileOne │ '0x6F57499deb45e81228b97ddcc6cf3DFA51aC3b3a' │
│ ReserveStrategy-rateStrategyStableOne   │ '0x11BAA69b9a1cBbCd4614F03Fa1a926bd10A4cc82' │
│ ReserveStrategy-rateStrategyStableTwo   │ '0xCa55224e6Fe9aCDDcC2f0121ca90Cc9650CC09fC' │
│ DAI-AToken-Aave                         │ '0x42B3Ab053f5Fc270f66879EB86d2954B78D94Bb6' │
│ DAI-VariableDebtToken-Aave              │ '0x433aC8f7879de759D4801A50bF2Bb9BF12b271A2' │
│ DAI-StableDebtToken-Aave                │ '0xdE96aCa585e94016D606BDD6AB6e5Fc56e7850Df' │
│ LINK-AToken-Aave                        │ '0x083c0A85135992620A2cC66fc4c95F8a216CE3FB' │
│ LINK-VariableDebtToken-Aave             │ '0xab74eAc31451758fA12944F9eCebf6Bf731e2267' │
│ LINK-StableDebtToken-Aave               │ '0x882A9af9c03D17c515a045F2622e0D766bEc6746' │
│ USDC-AToken-Aave                        │ '0xeC3642cf14Ae1cC106f1Bc7CaFC53Ca4E25D3028' │
│ USDC-VariableDebtToken-Aave             │ '0xa85B28B0AdBc6740608E3084655ba5531491C0f7' │
│ USDC-StableDebtToken-Aave               │ '0x2e5356dd37031F2F81c673d4199d4980904b5B00' │
│ WBTC-AToken-Aave                        │ '0xBfbF35d95811661Fb0871850B879dbf33C670F50' │
│ WBTC-VariableDebtToken-Aave             │ '0x15bD04621D7671071C2b514090853Ef64A4c5810' │
│ WBTC-StableDebtToken-Aave               │ '0x2F4FE0025a193b5050b8Ed15D5a89E7e3156444D' │
│ WETH-AToken-Aave                        │ '0x6fc9651020B0623c35B7EAdf24409cf58A265Bf5' │
│ WETH-VariableDebtToken-Aave             │ '0x4ED30Be931B1Fd3f0b7846E710732dF6fE0069e6' │
│ WETH-StableDebtToken-Aave               │ '0x7B56CFf522B550C7B05DC0C6a51128E8B0183734' │
│ USDT-AToken-Aave                        │ '0x464E292320C5Da993Ab8107cbAD374fAF9ef4177' │
│ USDT-VariableDebtToken-Aave             │ '0x024Aee89F034b69Fc4548AE26a5a0f7fA58136db' │
│ USDT-StableDebtToken-Aave               │ '0xf484A93DE35104295aDb5e78D364aed8f8eD78aE' │
│ AAVE-AToken-Aave                        │ '0x64e595bE985009039dE91F38d1d6e3DCA5533906' │
│ AAVE-VariableDebtToken-Aave             │ '0x17b03e81650f65DFbbA8c3d444ED19b59186Bd69' │
│ AAVE-StableDebtToken-Aave               │ '0xc397aAfed4de642d8772F9faA712DeE598422253' │
│ EURS-AToken-Aave                        │ '0xcba47185496C4E96B3bE1ad9daA422461fc876ea' │
│ EURS-VariableDebtToken-Aave             │ '0x0B8662F20C88E144b71eDa3cE65Bdb495B3661CE' │
│ EURS-StableDebtToken-Aave               │ '0x8F11BCA015725C79d2c5f6FD48d8260fE20718cf' │
│ MockFlashLoanReceiver                   │ '0x8Bd7b47C521Dbc962c66d742c0f530A9762DD87A' │
│ WrappedTokenGatewayV3                   │ '0x312786352F3b8E9F29162Fe6aF26816F288F58cE' │
│ WalletBalanceProvider                   │ '0x72D2dB61a8d8F55A8D158DB407827F81B8339348' │
└─────────────────────────────────────────┴──────────────────────────────────────────────┘

Mintable Reserves and Rewards
┌────────────────────────────────┬──────────────────────────────────────────────┐
│ (index)                        │ address                                      │
├────────────────────────────────┼──────────────────────────────────────────────┤
│ DAI-TestnetMintableERC20-Aave  │ '0x0094ae284C50310f206f76B5Edf110B23214D613' │
│ LINK-TestnetMintableERC20-Aave │ '0xCCb52885584B273742f2fA8106cAD86Ce750462a' │
│ USDC-TestnetMintableERC20-Aave │ '0x477819a57e506d1aF5dD36c02cFDa5E0A9eF8A6d' │
│ WBTC-TestnetMintableERC20-Aave │ '0xe82c673Ad2dAE5D7D0c29107D83224beDDDE3102' │
│ WETH-TestnetMintableERC20-Aave │ '0x309Dcbf53667659401d2d5e58763f4e0C303F5Ad' │
│ USDT-TestnetMintableERC20-Aave │ '0x4211555D509e5A87Ba1ACa452B03229a8e02118C' │
│ AAVE-TestnetMintableERC20-Aave │ '0x803f8e7E8816C4FCC64ef37d5Aa1B0e8a9A7e091' │
│ EURS-TestnetMintableERC20-Aave │ '0x92b6972dbc8B57D2708c01fDA4dFaB15B8CC4b61' │
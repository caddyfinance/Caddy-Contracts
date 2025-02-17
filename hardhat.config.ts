import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const MONAD_URL = process.env.MONAD_URL || "https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6";

// Ensure environment variables are properly typed
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: "10000000000000000000000000000" // 10 billion ETH
      }
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    monad: {
      url: MONAD_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      monad: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      },
      {
        network: "monad",
        chainId: 10143,
        urls: {
          apiURL: "https://api-monad.etherscan.io/api",
          browserURL: "https://testnet.monadexplorer.com/"
        }
      }
    ]
  },
  ignition: {
    modules: ['./ignition/modules'],
  }
};

export default config; 
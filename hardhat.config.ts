import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      accounts: {
        accountsBalance: "1000000000000000000000000" // 1,000,000 ETH
      }
    }
  }
};

export default config; 
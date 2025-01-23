const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());

  // Deploy Mock Token
  console.log("\nDeploying Mock Token...");
  const MockToken = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockToken.deploy("Mock Token", "MTK");
  await mockToken.waitForDeployment();
  console.log("Mock Token deployed to:", await mockToken.getAddress());

  // Deploy Mock Option Controller
  console.log("\nDeploying Mock Option Controller...");
  const MockOptionController = await ethers.getContractFactory("MockOptionController");
  const mockOptionController = await MockOptionController.deploy();
  await mockOptionController.waitForDeployment();
  console.log("Mock Option Controller deployed to:", await mockOptionController.getAddress());

  // Deploy Mock Strategy Manager
  console.log("\nDeploying Mock Strategy Manager...");
  const MockStrategyManager = await ethers.getContractFactory("MockStrategyManager");
  const mockStrategyManager = await MockStrategyManager.deploy();
  await mockStrategyManager.waitForDeployment();
  console.log("Mock Strategy Manager deployed to:", await mockStrategyManager.getAddress());

  // Deploy Mock Price Oracle
  console.log("\nDeploying Mock Price Oracle...");
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const mockPriceOracle = await MockPriceOracle.deploy();
  await mockPriceOracle.waitForDeployment();
  console.log("Mock Price Oracle deployed to:", await mockPriceOracle.getAddress());

  // Deploy Options Vault
  console.log("\nDeploying Options Vault...");
  const OptionsVault = await ethers.getContractFactory("OptionsVault");
  const optionsVault = await OptionsVault.deploy(
    await mockToken.getAddress(),
    await mockOptionController.getAddress(),
    await mockStrategyManager.getAddress(),
    await mockPriceOracle.getAddress()
  );
  await optionsVault.waitForDeployment();
  console.log("Options Vault deployed to:", await optionsVault.getAddress());

  // Print out all deployment addresses
  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("Mock Token:", await mockToken.getAddress());
  console.log("Mock Option Controller:", await mockOptionController.getAddress());
  console.log("Mock Strategy Manager:", await mockStrategyManager.getAddress());
  console.log("Mock Price Oracle:", await mockPriceOracle.getAddress());
  console.log("Options Vault:", await optionsVault.getAddress());

  // Verify contracts on Etherscan (if not on a local network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nVerifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: await mockToken.getAddress(),
        constructorArguments: ["Mock Token", "MTK"],
      });

      await hre.run("verify:verify", {
        address: await mockOptionController.getAddress(),
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: await mockStrategyManager.getAddress(),
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: await mockPriceOracle.getAddress(),
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: await optionsVault.getAddress(),
        constructorArguments: [
          await mockToken.getAddress(),
          await mockOptionController.getAddress(),
          await mockStrategyManager.getAddress(),
          await mockPriceOracle.getAddress(),
        ],
      });
    } catch (error) {
      console.error("Error verifying contracts:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
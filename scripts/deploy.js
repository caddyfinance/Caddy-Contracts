// scripts/deploy.js
const hre = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy Mock Tokens for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const underlyingToken = await MockERC20.deploy("Underlying", "UDRL");
    const quoteToken = await MockERC20.deploy("Quote", "QUOT");
    
    console.log("Underlying Token deployed to:", underlyingToken.address);
    console.log("Quote Token deployed to:", quoteToken.address);

    // Deploy OptionPricing
    const OptionPricing = await ethers.getContractFactory("OptionPricing");
    const pricing = await OptionPricing.deploy();
    await pricing.deployed();
    console.log("OptionPricing deployed to:", pricing.address);

    // Deploy OptionVault
    const OptionVault = await ethers.getContractFactory("OptionVault");
    const vault = await OptionVault.deploy(quoteToken.address);
    await vault.deployed();
    console.log("OptionVault deployed to:", vault.address);

    // Deploy OptionsManager
    const OptionsManager = await ethers.getContractFactory("OptionsManager");
    const manager = await OptionsManager.deploy(
        pricing.address,
        vault.address,
        underlyingToken.address,
        quoteToken.address
    );
    await manager.deployed();
    console.log("OptionsManager deployed to:", manager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


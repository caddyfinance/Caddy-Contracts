// scripts/deploy.js
const { ethers } = require("hardhat");

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

    // Deploy MockStETH
    const MockStETH = await ethers.getContractFactory("MockStETH");
    const mockStETH = await MockStETH.deploy();
    await mockStETH.deployed();
    console.log("MockStETH deployed to:", mockStETH.address);

    // Deploy MockPriceAggregator with initial price of 2000 USD (with 8 decimals)
    const MockPriceAggregator = await ethers.getContractFactory("MockPriceAggregator");
    const mockPriceAggregator = await MockPriceAggregator.deploy(200000000000, 8);
    await mockPriceAggregator.deployed();
    console.log("MockPriceAggregator deployed to:", mockPriceAggregator.address);

    // Deploy OptionsMarket with mock contracts
    const OptionsMarket = await ethers.getContractFactory("OptionsMarket");
    const optionsMarket = await OptionsMarket.deploy(
        mockStETH.address,
        mockPriceAggregator.address
    );
    await optionsMarket.deployed();
    console.log("OptionsMarket deployed to:", optionsMarket.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


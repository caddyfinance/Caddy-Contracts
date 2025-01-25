// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy MockERC20 (stETH)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockStETH = await MockERC20.deploy("Staked ETH", "stETH");
    await mockStETH.deployed();
    console.log("MockStETH deployed to:", mockStETH.address);

    // Deploy MockPriceFeed
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy();
    await mockPriceFeed.deployed();
    console.log("MockPriceFeed deployed to:", mockPriceFeed.address);

    // Deploy OptionsMarket
    const OptionsMarket = await ethers.getContractFactory("OptionsMarket");
    const optionsMarket = await OptionsMarket.deploy(
        mockStETH.address,
        mockPriceFeed.address
    );
    await optionsMarket.deployed();
    console.log("OptionsMarket deployed to:", optionsMarket.address);

    // Deploy OptionsFactory
    const OptionsFactory = await ethers.getContractFactory("OptionsFactory");
    const optionsFactory = await OptionsFactory.deploy();
    await optionsFactory.deployed();
    console.log("OptionsFactory deployed to:", optionsFactory.address);

    // Verify contracts on Etherscan
    console.log("Verifying contracts...");
    await hre.run("verify:verify", {
        address: mockStETH.address,
        constructorArguments: ["Staked ETH", "stETH"],
    });

    await hre.run("verify:verify", {
        address: mockPriceFeed.address,
        constructorArguments: [],
    });

    await hre.run("verify:verify", {
        address: optionsMarket.address,
        constructorArguments: [mockStETH.address, mockPriceFeed.address],
    });

    await hre.run("verify:verify", {
        address: optionsFactory.address,
        constructorArguments: [],
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


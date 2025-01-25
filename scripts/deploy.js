// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // Deploy MockERC20 (stETH)
    const MockERC20 = await ethers.getContractFactory("MockStETH");
    const mockStETH = await MockERC20.deploy();
    await mockStETH.waitForDeployment();
    console.log("MockStETH deployed to:", mockStETH.target);

    // Deploy MockPriceFeed
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const mockPriceFeed = await MockPriceFeed.deploy();
    await mockPriceFeed.waitForDeployment();
    console.log("MockPriceFeed deployed to:", mockPriceFeed.target);

    // Deploy OptionsMarket
    const OptionsMarket = await ethers.getContractFactory("OptionsMarket");
    const optionsMarket = await OptionsMarket.deploy(
        mockStETH.target,
        mockPriceFeed.target
    );
    await optionsMarket.waitForDeployment();
    console.log("OptionsMarket deployed to:", optionsMarket.target);

    // Deploy OptionsFactory
    const OptionsFactory = await ethers.getContractFactory("OptionsFactory");
    const optionsFactory = await OptionsFactory.deploy();
    await optionsFactory.waitForDeployment();
    console.log("OptionsFactory deployed to:", optionsFactory.target);

    console.log("Waiting 60 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60 seconds = 1 minute


    // Verify contracts on Etherscan
    console.log("Verifying contracts...");
    await hre.run("verify:verify", {
        address: mockStETH.target,
        constructorArguments: [],
    });

    await hre.run("verify:verify", {
        address: mockPriceFeed.target,
        constructorArguments: [],
    });

    await hre.run("verify:verify", {
        address: optionsMarket.target,
        constructorArguments: [mockStETH.target, mockPriceFeed.target],
    });

    await hre.run("verify:verify", {
        address: optionsFactory.target,
        constructorArguments: [],
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


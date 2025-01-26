import { ethers, run } from "hardhat";

async function verify(contractAddress: string, args: any[]) {
  console.log("Verifying contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e: any) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified!");
    } else {
      console.log(e);
    }
  }
}

async function main() {
  console.log("Starting deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", await deployer.getAddress());

  // Deploy MockERC20
  console.log("\nDeploying MockERC20...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Mock Token", "MTK");
  await mockERC20.waitForDeployment();
  console.log("MockERC20 deployed to:", await mockERC20.getAddress());

  // Deploy OptionPosition
  console.log("\nDeploying OptionPosition...");
  const OptionPosition = await ethers.getContractFactory("OptionPosition");
  const optionPosition = await OptionPosition.deploy();
  await optionPosition.waitForDeployment();
  console.log("OptionPosition deployed to:", await optionPosition.getAddress());

  // Deploy OptionsEngine
  console.log("\nDeploying OptionsEngine...");
  const OptionsEngine = await ethers.getContractFactory("OptionsEngine");
  const optionsEngine = await OptionsEngine.deploy(await optionPosition.getAddress());
  await optionsEngine.waitForDeployment();
  console.log("OptionsEngine deployed to:", await optionsEngine.getAddress());

  // Setup roles
  console.log("\nSetting up roles...");
  const MINTER_ROLE = await optionPosition.MINTER_ROLE();
  const PRICE_UPDATER_ROLE = await optionPosition.PRICE_UPDATER_ROLE();

  // Grant MINTER_ROLE to OptionsEngine
  const grantMinterTx = await optionPosition.grantRole(MINTER_ROLE, await optionsEngine.getAddress());
  await grantMinterTx.wait();
  console.log("Granted MINTER_ROLE to OptionsEngine");

  // Mint some initial tokens to deployer
  const mintAmount = ethers.parseEther("1000000"); // 1M tokens
  await mockERC20.mint(await deployer.getAddress(), mintAmount);
  console.log("Minted", ethers.formatEther(mintAmount), "tokens to deployer");

  // Verify contracts on Etherscan
  console.log("\nVerifying contracts on Etherscan...");
  try {
    // Verify MockERC20
    await verify(await mockERC20.getAddress(), ["Mock Token", "MTK"]);
    console.log("MockERC20 verified");

    // Verify OptionPosition
    await verify(await optionPosition.getAddress(), []);
    console.log("OptionPosition verified");

    // Verify OptionsEngine
    await verify(await optionsEngine.getAddress(), [await optionPosition.getAddress()]);
    console.log("OptionsEngine verified");
  } catch (error) {
    console.log("Error verifying contracts:", error);
  }

  // Print deployment summary
  console.log("\nDeployment Summary");
  console.log("=================");
  console.log("MockERC20:", await mockERC20.getAddress());
  console.log("OptionPosition:", await optionPosition.getAddress());
  console.log("OptionsEngine:", await optionsEngine.getAddress());
  console.log("Deployer:", await deployer.getAddress());
  console.log("Current Price:", await optionPosition.getCurrentPrice());
  console.log("Deployer Token Balance:", ethers.formatEther(await mockERC20.balanceOf(await deployer.getAddress())));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
import { ethers } from "hardhat";

async function main() {
  // Deploy OptionPosition
  const OptionPosition = await ethers.getContractFactory("OptionPosition");
  const optionPosition = await OptionPosition.deploy();
  await optionPosition.deployed();
  console.log("OptionPosition deployed to:", optionPosition.address);

  // Deploy OptionsEngine
  const OptionsEngine = await ethers.getContractFactory("OptionsEngine");
  const optionsEngine = await OptionsEngine.deploy(optionPosition.address);
  await optionsEngine.deployed();
  console.log("OptionsEngine deployed to:", optionsEngine.address);

  // Grant MINTER_ROLE to OptionsEngine
  const MINTER_ROLE = await optionPosition.MINTER_ROLE();
  await optionPosition.grantRole(MINTER_ROLE, optionsEngine.address);
  console.log("MINTER_ROLE granted to OptionsEngine");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
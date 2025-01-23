const hre = require("hardhat");

async function main() {
  // Deploy DepositContract
  const DepositContract = await hre.ethers.getContractFactory("DepositContract");
  const depositContract = await DepositContract.deploy();
  await depositContract.deployed();
  console.log("DepositContract deployed to:", depositContract.address);

  // Deploy OptionsContract
  const OptionsContract = await hre.ethers.getContractFactory("OptionsContract");
  const optionsContract = await OptionsContract.deploy(depositContract.address);
  await optionsContract.deployed();
  console.log("OptionsContract deployed to:", optionsContract.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
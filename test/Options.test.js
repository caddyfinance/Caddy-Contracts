const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Options Contract", function () {
  let depositContract;
  let optionsContract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const DepositContract = await ethers.getContractFactory("DepositContract");
    depositContract = await DepositContract.deploy();
    await depositContract.deployed();

    const OptionsContract = await ethers.getContractFactory("OptionsContract");
    optionsContract = await OptionsContract.deploy(depositContract.address);
    await optionsContract.deployed();
  });

  describe("Option Creation", function () {
    it("Should create a new option", async function () {
      const strike = ethers.utils.parseEther("1");
      const premium = ethers.utils.parseEther("0.1");
      const expiry = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
      
      await optionsContract.createOption(strike, premium, expiry, true);
      
      const option = await optionsContract.options(0);
      expect(option.strike).to.equal(strike);
      expect(option.premium).to.equal(premium);
      expect(option.expiry).to.equal(expiry);
      expect(option.isCall).to.equal(true);
      expect(option.writer).to.equal(owner.address);
    });
  });
}); 
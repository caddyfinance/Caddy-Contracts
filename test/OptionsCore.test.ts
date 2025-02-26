// test/Options.test.ts
import { expect } from "chai";
import { network, ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { Log, parseEther } from "ethers";
import { OptionPosition, OptionsEngine, MockERC20 } from "../typechain-types";

describe("Options Protocol", function () {
  let optionPosition: OptionPosition;
  let optionsEngine: OptionsEngine;
  let mockERC20: MockERC20;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Log initial balances
    console.log("User1 initial balance:", (await user1.provider.getBalance(await user1.getAddress())).toString());
    console.log("User2 initial balance:", (await user2.provider.getBalance(await user2.getAddress())).toString());

    // Deploy mock ERC20
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockERC20 = await MockERC20Factory.deploy("Mock Token", "MTK");
    await mockERC20.waitForDeployment();

    // Deploy OptionPosition
    const OptionPositionFactory = await ethers.getContractFactory("OptionPosition");
    optionPosition = await OptionPositionFactory.deploy();
    await optionPosition.waitForDeployment();

    // Deploy OptionsEngine
    const OptionsEngineFactory = await ethers.getContractFactory("OptionsEngine");
    optionsEngine = await OptionsEngineFactory.deploy(await optionPosition.getAddress());
    await optionsEngine.waitForDeployment();

    // Grant MINTER_ROLE
    const MINTER_ROLE = await optionPosition.MINTER_ROLE();
    await optionPosition.grantRole(MINTER_ROLE, await optionsEngine.getAddress());

    // Mint tokens to users with smaller amounts
    await mockERC20.mint(await user1.getAddress(), parseEther("10"));
    await mockERC20.mint(await user2.getAddress(), parseEther("10"));
  });

  describe("Long Call", function () {
    it("should create long call position", async function () {
      const amount = parseEther("0.00001"); // Even smaller amount
      const strikePrice = parseEther("0.00001"); 
      
      const currentTime = await time.latest();
      const expiry = currentTime + 5;
      
      const premium = await optionPosition.calculatePremium(
        amount,
        strikePrice,
        0 // LONG_CALL
      );

      console.log("Premium for long call:", premium.toString());

      await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        0, // LONG_CALL
        { value: premium }
      );

      const [underlying, , strikePrice_, expiry_, amount_, positionType_] = await optionPosition.getPosition(0);
      expect(underlying).to.equal(await mockERC20.getAddress());
      expect(positionType_).to.equal(0);
      expect(amount_).to.equal(amount);
      expect(strikePrice_).to.equal(strikePrice);
    });

    it("should exercise long call at expiry", async function () {
      const amount = parseEther("0.00001");
      const strikePrice = parseEther("0.00001");
      const currentTime = await time.latest();
      const expiry = currentTime + 5;

      // First create a short call position to provide collateral
      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), amount);
      await optionsEngine.connect(user2).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        1 // SHORT_CALL
      );

      const premium = await optionPosition.calculatePremium(amount, strikePrice, 0);
      await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        0, // LONG_CALL
        { value: premium }
      );

      await time.increaseTo(expiry);

      // Fix: Don't scale down the payment amount
      const paymentAmount = amount * strikePrice;
      console.log("Exercise payment amount:", paymentAmount.toString());
      
      await optionsEngine.connect(user1).exercise(1, {
        value: paymentAmount
      });

      const [, , , , , , isSettled] = await optionPosition.getPosition(1);
      expect(isSettled).to.be.true;
    });
  });

  describe("Short Call", function () {
    it("should create short call position", async function () {
      const amount = parseEther("0.00001");  // Match the amount used in other tests
      const strikePrice = parseEther("0.00001");
      const currentTime = await time.latest();
      const expiry = currentTime + 5;

      await mockERC20.connect(user1).approve(await optionsEngine.getAddress(), amount);
      await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        1 // SHORT_CALL
      );

      const [, , , , , positionType_] = await optionPosition.getPosition(0);
      expect(positionType_).to.equal(1);
    });
  });

  describe("Long Put", function () {
    it("should create long put position", async function () {
      const amount = parseEther("0.00001");  // Match the amount used in other tests
      const strikePrice = parseEther("0.00001");
      const currentTime = await time.latest();
      const expiry = currentTime + 5;

      const premium = await optionPosition.calculatePremium(amount, strikePrice, 2);
      await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        2, // LONG_PUT
        { value: premium }
      );

      const [, , , , , positionType_] = await optionPosition.getPosition(0);
      expect(positionType_).to.equal(2);
    });
  });

  describe("Short Put", function () {
    it("should create short put position", async function () {
      const amount = parseEther("0.00001");
      const strikePrice = parseEther("0.00001");
      const currentTime = await time.latest();
      const expiry = currentTime + 5;

      // Calculate collateral exactly as the contract does
      const collateral = amount * strikePrice;  // First multiply amount and strike price
      console.log("Base collateral:", collateral.toString());
      
      // Then apply the ratio
      const finalCollateral = (collateral * BigInt(12000)) / BigInt(10000);
      console.log("Amount:", amount.toString());
      console.log("Strike Price:", strikePrice.toString());
      console.log("Final Collateral:", finalCollateral.toString());

      await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        3, // SHORT_PUT
        { value: finalCollateral }
      );

      const [, , , , , positionType_] = await optionPosition.getPosition(0);
      expect(positionType_).to.equal(3);
    });
  });

  describe("Withdrawals", function () {
    it("should allow owner to withdraw tokens", async function () {
      // First send some tokens to the contract
      const amount = parseEther("1");
      await mockERC20.mint(await optionsEngine.getAddress(), amount);

      // Check initial balances
      const initialContractBalance = await mockERC20.balanceOf(await optionsEngine.getAddress());
      const initialOwnerBalance = await mockERC20.balanceOf(await owner.getAddress());

      // Withdraw tokens
      await optionsEngine.connect(owner).withdrawToken(await mockERC20.getAddress(), amount);

      // Check final balances
      const finalContractBalance = await mockERC20.balanceOf(await optionsEngine.getAddress());
      const finalOwnerBalance = await mockERC20.balanceOf(await owner.getAddress());

      expect(finalContractBalance).to.equal(initialContractBalance - amount);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + amount);
    });

    it("should allow owner to withdraw ETH", async function () {
      // First send some ETH to the contract
      const amount = parseEther("1");
      await owner.sendTransaction({
        to: await optionsEngine.getAddress(),
        value: amount
      });

      // Check initial balances
      const initialContractBalance = await ethers.provider.getBalance(await optionsEngine.getAddress());
      const initialOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());

      // Withdraw ETH
      const tx = await optionsEngine.connect(owner).withdrawETH(amount);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;

      // Check final balances
      const finalContractBalance = await ethers.provider.getBalance(await optionsEngine.getAddress());
      const finalOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());

      expect(finalContractBalance).to.equal(initialContractBalance - amount);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + amount - gasCost);
    });

    it("should not allow non-owner to withdraw", async function () {
      await expect(
        optionsEngine.connect(user1).withdrawToken(await mockERC20.getAddress(), parseEther("1"))
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        optionsEngine.connect(user1).withdrawETH(parseEther("1"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
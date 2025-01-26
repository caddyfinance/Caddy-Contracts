// test/Options.test.ts
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "hardhat";
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

    // Mint tokens to users
    await mockERC20.mint(await user1.getAddress(), parseEther("1000"));
    await mockERC20.mint(await user2.getAddress(), parseEther("1000"));
  });

  describe("Long Call", function () {
    it("should create long call position", async function () {
      const amount = parseEther("0.0000000001");
      const strikePrice = parseEther("0.0000000001");
      const expiry = (await time.latest()) + 86400 * 30; // 30 days

      console.log("amount", amount);
      console.log("strikePrice", strikePrice);
      console.log("expiry", expiry);
      // Calculate premium
      const premium = await optionPosition.calculatePremium(
        amount,
        strikePrice,
        0 // LONG_CALL
      );
      console.log("premium", premium);

      // Open position
      const tx = await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        0, // LONG_CALL
        { value: premium }
      );
      await tx.wait();

      console.log("tx", tx);
      const tokenId = 0;
      const [, , strikePrice_, , amount_, positionType_] = await optionPosition.getPosition(tokenId);
      expect(positionType_).to.equal(0); // LONG_CALL
      expect(amount_).to.equal(amount);
      expect(strikePrice_).to.equal(strikePrice);
    });

    it("should exercise long call at expiry", async function () {
      console.log("user1", await user1.getAddress());
      // Create position
      const amount = parseEther("0.0000000001");
      const strikePrice = parseEther("0.0000000001");
      const expiry = (await time.latest()) + 86400 * 30;
      console.log("amount", amount);
      console.log("strikePrice", strikePrice);
      console.log("expiry", expiry);

      // First create a short call position to provide collateral
      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), amount);
      await optionsEngine.connect(user2).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        1, // SHORT_CALL
      );

      // Now create the long call position
      const premium = await optionPosition.calculatePremium(amount, strikePrice, 0);

      console.log("premium", premium);
      const tx = await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        0, // LONG_CALL
        { value: premium }
      );
      await tx.wait();

      console.log("tx", tx);

      // Fast forward to expiry
      await time.increaseTo(expiry);

      // Exercise
      const amountBigInt = BigInt(amount.toString());
      const strikePriceBigInt = BigInt(strikePrice.toString());
      await optionsEngine.connect(user1).exercise(1, { // Note: tokenId is 1 for the long call
        value: amountBigInt * strikePriceBigInt
      });

      const [, , , , , , isSettled] = await optionPosition.getPosition(1);
      expect(isSettled).to.be.true;
    });
  });

  describe("Short Call", function () {
    it("should create short call position", async function () {
      const amount = parseEther("0.001");
      const strikePrice = parseEther("0.001");
      const expiry = (await time.latest()) + 86400 * 30;

      // Approve tokens
      await mockERC20.connect(user1).approve(await optionsEngine.getAddress(), amount);

      await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        1 // SHORT_CALL
      );

      const [, , , , , positionType_] = await optionPosition.getPosition(0);
      expect(positionType_).to.equal(1); // SHORT_CALL
    });
  });

  describe("Long Put", function () {
    it("should create long put position", async function () {
      const amount = parseEther("0.0000000001");
      const strikePrice = parseEther("0.0000000001");
      const expiry = (await time.latest()) + 86400 * 30;

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
      expect(positionType_).to.equal(2); // LONG_PUT
    });
  });

  describe("Short Put", function () {
    it("should create short put position", async function () {
      const amount = parseEther("0.0000000001");
      const strikePrice = parseEther("0.0000000001");
      const expiry = (await time.latest()) + 86400 * 30;

      // Convert to BigInt before operations
      const amountBigInt = BigInt(amount.toString());
      const strikePriceBigInt = BigInt(strikePrice.toString());
      const collateral = (amountBigInt * strikePriceBigInt * 12000n) / 10000n;

      await optionsEngine.connect(user1).openPosition(
        await mockERC20.getAddress(),
        amount,
        strikePrice,
        expiry,
        3, // SHORT_PUT
        { value: collateral }
      );

      const [, , , , , positionType_] = await optionPosition.getPosition(0);
      expect(positionType_).to.equal(3); // SHORT_PUT
    });
  });
});
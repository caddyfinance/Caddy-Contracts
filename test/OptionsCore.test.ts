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

    // Mint tokens to users
    await mockERC20.mint(await user1.getAddress(), parseEther("1000"));
    await mockERC20.mint(await user2.getAddress(), parseEther("1000"));
  });

  describe("Long Call", function () {
    it("should create long call position", async function () {
      const params = {
        underlying: await mockERC20.getAddress(),
        amount: parseEther("0.1"),
        strikePrice: parseEther("0.1"),
        expiry: (await time.latest()) + 100,
        positionType: 0, // LONG_CALL
        premium: parseEther("0.01"),
        isActive: true,
        walletType: 0
      };

      // Create SHORT_CALL first
      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), params.amount);
      await optionsEngine.connect(user2).openPosition({
        ...params,
        positionType: 1 // SHORT_CALL
      });

      // Create LONG_CALL
      await mockERC20.connect(user1).approve(await optionsEngine.getAddress(), params.premium);
      const tx = await optionsEngine.connect(user1).openPosition(params);

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        log => log.fragment?.name === "PositionOpened"
      );
      expect(event).to.not.be.undefined;
    });

    it("should exercise long call at expiry", async function () {
      const params = {
        underlying: await mockERC20.getAddress(),
        amount: parseEther("0.1"),      // 0.1 tokens
        strikePrice: parseEther("0.1"), // 0.1 ETH per token
        expiry: (await time.latest()) + 100,
        positionType: 0, // LONG_CALL
        premium: parseEther("0.01"),
        isActive: true,
        walletType: 0
      };

      // Create SHORT_CALL first
      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), params.amount);
      await optionsEngine.connect(user2).openPosition({
        ...params,
        positionType: 1 // SHORT_CALL
      });

      // Create LONG_CALL
      await mockERC20.connect(user1).approve(await optionsEngine.getAddress(), params.premium);
      const tx = await optionsEngine.connect(user1).openPosition(params);

      await time.increaseTo(params.expiry);

      const receipt = await tx.wait();
      const tokenId = receipt?.logs.find(
        log => log.fragment?.name === "PositionOpened"
      )?.args?.tokenId;

      // To exercise a call, we need to pay: amount * strikePrice
      // If we're buying 0.1 tokens at 0.1 ETH each, we need to pay 0.01 ETH
      const paymentAmount = params.amount * params.strikePrice / parseEther("1");
      
      // Log the values to debug
      console.log("Amount:", params.amount.toString());
      console.log("Strike Price:", params.strikePrice.toString());
      console.log("Payment Amount:", paymentAmount.toString());

      await optionsEngine.connect(user1).exercise(tokenId, {
        value: paymentAmount
      });
    });
  });

  describe("Short Call", function () {
    it("should create short call position", async function () {
      const params = {
        underlying: await mockERC20.getAddress(),
        amount: parseEther("0.1"),
        strikePrice: parseEther("0.1"),
        expiry: (await time.latest()) + 100,
        positionType: 1, // SHORT_CALL
        premium: parseEther("0.01"),
        isActive: true,
        walletType: 0
      };

      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), params.amount);
      const tx = await optionsEngine.connect(user2).openPosition(params);

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        log => log.fragment?.name === "PositionOpened"
      );
      expect(event).to.not.be.undefined;
    });
  });

  describe("Long Put", function () {
    it("should create long put position", async function () {
      const params = {
        underlying: await mockERC20.getAddress(),
        amount: parseEther("0.1"),
        strikePrice: parseEther("0.1"),
        expiry: (await time.latest()) + 100,
        positionType: 2, // LONG_PUT
        premium: parseEther("0.01"),
        isActive: true,
        walletType: 0
      };

      // Create SHORT_PUT first with proper collateral
      const collateral = BigInt(params.amount) * BigInt(params.strikePrice) * BigInt(120) / BigInt(100);
      
      // Mint tokens for collateral
      await mockERC20.mint(await user2.getAddress(), collateral);
      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), collateral);
      
      await optionsEngine.connect(user2).openPosition({
        ...params,
        positionType: 3 // SHORT_PUT
      });

      // Create LONG_PUT
      await mockERC20.connect(user1).approve(await optionsEngine.getAddress(), params.premium);
      const tx = await optionsEngine.connect(user1).openPosition(params);

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        log => log.fragment?.name === "PositionOpened"
      );
      expect(event).to.not.be.undefined;
    });

    it("should exercise long put at expiry", async function () {
      const params = {
        underlying: await mockERC20.getAddress(),
        amount: parseEther("0.1"),
        strikePrice: parseEther("0.1"),
        expiry: (await time.latest()) + 100,
        positionType: 2, // LONG_PUT
        premium: parseEther("0.01"),
        isActive: true,
        walletType: 0
      };

      // Create SHORT_PUT first with proper collateral
      const collateral = BigInt(params.amount) * BigInt(params.strikePrice) * BigInt(120) / BigInt(100);
      await mockERC20.mint(await user2.getAddress(), collateral);
      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), collateral);
      
      await optionsEngine.connect(user2).openPosition({
        ...params,
        positionType: 3 // SHORT_PUT
      });

      // Create LONG_PUT
      await mockERC20.connect(user1).approve(await optionsEngine.getAddress(), params.premium);
      const tx = await optionsEngine.connect(user1).openPosition(params);

      await time.increaseTo(params.expiry);

      const receipt = await tx.wait();
      const tokenId = receipt?.logs.find(
        log => log.fragment?.name === "PositionOpened"
      )?.args?.tokenId;

      // For exercising a put, we need to:
      // 1. Have enough underlying tokens
      await mockERC20.mint(await user1.getAddress(), params.amount);
      // 2. Approve the contract to spend our tokens
      await mockERC20.connect(user1).approve(await optionsEngine.getAddress(), params.amount);
      
      // Log balances before exercise
      console.log("User1 token balance:", (await mockERC20.balanceOf(await user1.getAddress())).toString());
      console.log("Contract allowance:", (await mockERC20.allowance(await user1.getAddress(), await optionsEngine.getAddress())).toString());

      await optionsEngine.connect(user1).exercise(tokenId);
    });
  });

  describe("Short Put", function () {
    it("should create short put position", async function () {
      const params = {
        underlying: await mockERC20.getAddress(),
        amount: parseEther("0.1"),
        strikePrice: parseEther("0.1"),
        expiry: (await time.latest()) + 100,
        positionType: 3, // SHORT_PUT
        premium: parseEther("0.01"),
        isActive: true,
        walletType: 0
      };

      const collateral = (params.amount * params.strikePrice * BigInt(12000)) / BigInt(10000);
      await mockERC20.mint(await user2.getAddress(), collateral);
      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), collateral);
      
      const tx = await optionsEngine.connect(user2).openPosition(params);

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        log => log.fragment?.name === "PositionOpened"
      );
      expect(event).to.not.be.undefined;
    });
  });

  describe("Withdrawals", function () {
    it("should allow owner to withdraw tokens", async function () {
      const amount = parseEther("1");
      await mockERC20.mint(await optionsEngine.getAddress(), amount);

      await optionsEngine.connect(owner).withdrawToken(await mockERC20.getAddress());

      const finalContractBalance = await mockERC20.balanceOf(await optionsEngine.getAddress());
      expect(finalContractBalance).to.equal(0);
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
        optionsEngine.connect(user1).withdrawToken(await mockERC20.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        optionsEngine.connect(user1).withdrawETH(parseEther("1"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Premium Withdrawal", function () {
    it("should allow SHORT_CALL writer to withdraw premium after expiry", async function () {
      const params = {
        underlying: await mockERC20.getAddress(),
        amount: parseEther("0.1"),
        strikePrice: parseEther("0.1"),
        expiry: (await time.latest()) + 100,
        positionType: 1, // SHORT_CALL
        premium: parseEther("0.01"),
        isActive: true,
        walletType: 0
      };

      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), params.amount);
      const tx = await optionsEngine.connect(user2).openPosition(params);

      const receipt = await tx.wait();
      const tokenId = receipt?.logs.find(
        log => log.fragment?.name === "PositionOpened"
      )?.args?.tokenId;

      await time.increaseTo(params.expiry + 1);
      await optionsEngine.connect(user2).withdrawPremium(tokenId);
    });

    it("should not allow premium withdrawal before expiry", async function () {
      const params = {
        underlying: await mockERC20.getAddress(),
        amount: parseEther("0.1"),
        strikePrice: parseEther("0.1"),
        expiry: (await time.latest()) + 100,
        positionType: 1, // SHORT_CALL
        premium: parseEther("0.01"),
        isActive: true,
        walletType: 0
      };

      await mockERC20.connect(user2).approve(await optionsEngine.getAddress(), params.amount);
      const tx = await optionsEngine.connect(user2).openPosition(params);

      const receipt = await tx.wait();
      const tokenId = receipt?.logs.find(
        log => log.fragment?.name === "PositionOpened"
      )?.args?.tokenId;

      await expect(
        optionsEngine.connect(user2).withdrawPremium(tokenId)
      ).to.be.revertedWith("Position still active");
    });
  });
});
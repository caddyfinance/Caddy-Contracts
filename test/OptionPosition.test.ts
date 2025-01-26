import { expect } from "chai";
import { ethers } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { OptionPosition } from "../typechain-types";
import { EventLog } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("OptionPosition", function () {
  let optionPosition: OptionPosition;
  let owner: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let user: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, minter, user] = await ethers.getSigners();

    // Deploy OptionPosition
    const OptionPositionFactory = await ethers.getContractFactory("OptionPosition");
    optionPosition = await OptionPositionFactory.deploy();
    await optionPosition.waitForDeployment();

    // Grant MINTER_ROLE to minter
    const MINTER_ROLE = await optionPosition.MINTER_ROLE();
    await optionPosition.grantRole(MINTER_ROLE, await minter.getAddress());
  });

  describe("Deployment", function () {
    it("should set the correct name and symbol", async function () {
      expect(await optionPosition.name()).to.equal("Options Position");
      expect(await optionPosition.symbol()).to.equal("OPT");
    });

    it("should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await optionPosition.DEFAULT_ADMIN_ROLE();
      expect(await optionPosition.hasRole(DEFAULT_ADMIN_ROLE, await owner.getAddress())).to.be.true;
    });
  });

  describe("Role Management", function () {
    it("should allow admin to grant MINTER_ROLE", async function () {
      const MINTER_ROLE = await optionPosition.MINTER_ROLE();
      await optionPosition.grantRole(MINTER_ROLE, await user.getAddress());
      expect(await optionPosition.hasRole(MINTER_ROLE, await user.getAddress())).to.be.true;
    });

    it("should allow admin to revoke MINTER_ROLE", async function () {
      const MINTER_ROLE = await optionPosition.MINTER_ROLE();
      await optionPosition.revokeRole(MINTER_ROLE, await minter.getAddress());
      expect(await optionPosition.hasRole(MINTER_ROLE, await minter.getAddress())).to.be.false;
    });

    it("should not allow non-admin to grant MINTER_ROLE", async function () {
      const MINTER_ROLE = await optionPosition.MINTER_ROLE();
      await expect(
        optionPosition.connect(user).grantRole(MINTER_ROLE, await user.getAddress())
      ).to.be.rejectedWith("AccessControl: account 0x");
    });
  });

  describe("Position Minting", function () {
    it("should allow minter to mint a new position", async function () {
      const underlying = "0x1234567890123456789012345678901234567890";
      const strikeAsset = "0x0987654321098765432109876543210987654321";
      const strikePrice = 1000n;
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400); // 1 day from now
      const amount = 100n;
      const positionType = 0; // LONG_CALL

      const tx = await optionPosition.connect(minter).mint(
        await user.getAddress(),
        underlying,
        strikeAsset,
        strikePrice,
        expiry,
        amount,
        positionType
      );

      const receipt = await tx.wait();
      expect(receipt?.logs[0]).to.exist;

      const position = await optionPosition.getPosition(0);
      expect(position.underlying).to.equal(underlying);
      expect(position.strikeAsset).to.equal(strikeAsset);
      expect(position.strikePrice).to.equal(strikePrice);
      expect(position.expiry).to.equal(expiry);
      expect(position.amount).to.equal(amount);
      expect(position.positionType).to.equal(positionType);
      expect(position.isSettled).to.be.false;
    });

    it("should not allow non-minter to mint a position", async function () {
      await expect(
        optionPosition.connect(user).mint(
          await user.getAddress(),
          "0x1234567890123456789012345678901234567890",
          "0x0987654321098765432109876543210987654321",
          1000n,
          BigInt(Math.floor(Date.now() / 1000) + 86400),
          100n,
          0
        )
      ).to.be.rejectedWith("AccessControl: account 0x");
    });

    it("should increment token ID for each mint", async function () {
      const underlying = "0x1234567890123456789012345678901234567890";
      const strikeAsset = "0x0987654321098765432109876543210987654321";
      const strikePrice = 1000n;
      const expiry = BigInt(Math.floor(Date.now() / 1000) + 86400);
      const amount = 100n;
      const positionType = 0;

      await optionPosition.connect(minter).mint(
        await user.getAddress(),
        underlying,
        strikeAsset,
        strikePrice,
        expiry,
        amount,
        positionType
      );

      await optionPosition.connect(minter).mint(
        await user.getAddress(),
        underlying,
        strikeAsset,
        strikePrice,
        expiry,
        amount,
        positionType
      );

      expect(await optionPosition.ownerOf(0)).to.equal(await user.getAddress());
      expect(await optionPosition.ownerOf(1)).to.equal(await user.getAddress());
    });
  });

  describe("Position Settlement", function () {
    beforeEach(async function () {
      // Mint a position for testing settlement
      await optionPosition.connect(minter).mint(
        await user.getAddress(),
        "0x1234567890123456789012345678901234567890",
        "0x0987654321098765432109876543210987654321",
        1000n,
        BigInt(Math.floor(Date.now() / 1000) + 86400),
        100n,
        0
      );
    });

    it("should allow minter to settle a position", async function () {
      await optionPosition.connect(minter).setSettled(0);
      const position = await optionPosition.getPosition(0);
      expect(position.isSettled).to.be.true;
    });

    it("should not allow non-minter to settle a position", async function () {
      await expect(
        optionPosition.connect(user).setSettled(0)
      ).to.be.rejectedWith("AccessControl: account 0x");
    });
  });

  describe("Position Querying", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      // Mint a position for testing queries
      const tx = await optionPosition.connect(minter).mint(
        await user.getAddress(),
        "0x1234567890123456789012345678901234567890",
        "0x0987654321098765432109876543210987654321",
        1000n,
        BigInt(Math.floor(Date.now() / 1000) + 86400),
        100n,
        0
      );
      const receipt = await tx.wait();
      if (receipt && receipt.logs[0]) {
        tokenId = 0n; // First token ID
      }
    });

    it("should return correct position details", async function () {
      const position = await optionPosition.getPosition(tokenId);
      expect(position.underlying).to.equal("0x1234567890123456789012345678901234567890");
      expect(position.strikeAsset).to.equal("0x0987654321098765432109876543210987654321");
      expect(position.strikePrice).to.equal(1000n);
      expect(position.amount).to.equal(100n);
      expect(position.positionType).to.equal(0);
      expect(position.isSettled).to.be.false;
    });

    it("should return correct position details after settlement", async function () {
      await optionPosition.connect(minter).setSettled(tokenId);
      const position = await optionPosition.getPosition(tokenId);
      expect(position.isSettled).to.be.true;
    });
  });

  describe("Timestamp", function () {
    it("should return current block timestamp", async function () {
      const currentTime = await time.latest();
      const contractTime = await optionPosition.getCurrentTimestamp();
      expect(contractTime).to.equal(currentTime);
    });
  });

  describe("Price Management", function () {
    it("should return the default price", async function () {
      const price = await optionPosition.getCurrentPrice();
      expect(price).to.equal(2000n);
    });

    it("should allow PRICE_UPDATER_ROLE to update price", async function () {
      const PRICE_UPDATER_ROLE = await optionPosition.PRICE_UPDATER_ROLE();
      await optionPosition.grantRole(PRICE_UPDATER_ROLE, await minter.getAddress());

      const oldPrice = await optionPosition.getCurrentPrice();
      const newPrice = 2500n;

      const tx = await optionPosition.connect(minter).updatePrice(newPrice);
      const receipt = await tx.wait();

      // Check event
      const event = receipt?.logs[0] as EventLog;
      expect(event.eventName).to.equal("PriceUpdated");
      expect(event.args[0]).to.equal(oldPrice); // oldPrice
      expect(event.args[1]).to.equal(newPrice); // newPrice
      expect(event.args[2]).to.equal(await minter.getAddress()); // updater

      // Check state
      expect(await optionPosition.getCurrentPrice()).to.equal(newPrice);
    });

    it("should not allow non-PRICE_UPDATER_ROLE to update price", async function () {
      await expect(
        optionPosition.connect(user).updatePrice(2500n)
      ).to.be.rejectedWith("AccessControl: account 0x");
    });

    it("should not allow setting price to zero", async function () {
      const PRICE_UPDATER_ROLE = await optionPosition.PRICE_UPDATER_ROLE();
      await optionPosition.grantRole(PRICE_UPDATER_ROLE, await minter.getAddress());

      await expect(
        optionPosition.connect(minter).updatePrice(0)
      ).to.be.rejectedWith("Price must be greater than 0");
    });

    it("should affect premium calculation", async function () {
      const amount = 100n;
      const strikePrice = 2000n;
      const positionType = 0; // LONG_CALL

      // Get premium with default price (2000)
      const initialPremium = await optionPosition.calculatePremium(amount, strikePrice, positionType);

      // Update price to 2500
      const PRICE_UPDATER_ROLE = await optionPosition.PRICE_UPDATER_ROLE();
      await optionPosition.grantRole(PRICE_UPDATER_ROLE, await minter.getAddress());
      await optionPosition.connect(minter).updatePrice(2500n);

      // Get premium with new price
      const newPremium = await optionPosition.calculatePremium(amount, strikePrice, positionType);

      // Premium should be different
      expect(newPremium).to.not.equal(initialPremium);
    });
  });
}); 
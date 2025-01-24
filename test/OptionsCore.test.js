const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Options Protocol", function () {
    let OptionPricing;
    let OptionVault;
    let OptionsManager;
    let MockERC20;
    let pricing;
    let vault;
    let manager;
    let underlyingToken;
    let quoteToken;
    let owner;
    let writer;
    let buyer;

    beforeEach(async function () {
        [owner, writer, buyer] = await ethers.getSigners();

        // Deploy mock tokens
        MockERC20 = await ethers.getContractFactory("MockERC20");
        underlyingToken = await MockERC20.deploy("Underlying", "UDRL");
        quoteToken = await MockERC20.deploy("Quote", "QUOT");

        // Deploy core contracts
        OptionPricing = await ethers.getContractFactory("OptionPricing");
        pricing = await OptionPricing.deploy();

        OptionVault = await ethers.getContractFactory("OptionVault");
        vault = await OptionVault.deploy(quoteToken.address);

        OptionsManager = await ethers.getContractFactory("OptionsManager");
        manager = await OptionsManager.deploy(
            pricing.address,
            vault.address,
            underlyingToken.address,
            quoteToken.address
        );

        // Setup tokens
        await underlyingToken.mint(writer.address, ethers.utils.parseEther("1000"));
        await quoteToken.mint(writer.address, ethers.utils.parseEther("1000"));
        await quoteToken.mint(buyer.address, ethers.utils.parseEther("1000"));

        // Approvals
        await underlyingToken.connect(writer).approve(manager.address, ethers.constants.MaxUint256);
        await quoteToken.connect(writer).approve(manager.address, ethers.constants.MaxUint256);
        await quoteToken.connect(buyer).approve(manager.address, ethers.constants.MaxUint256);
    });

    describe("Option Pricing", function() {
        it("Should calculate call option price correctly", async function() {
            const strike = ethers.utils.parseEther("1400");
            const timeToExpiry = 86400; // 1 day
            const volatility = ethers.utils.parseEther("0.2"); // 20%
            const currentPrice = ethers.utils.parseEther("1500");

            const price = await pricing.getOptionPrice(
                strike,
                timeToExpiry,
                volatility,
                currentPrice,
                true
            );

            expect(price).to.be.gt(0);
        });

        it("Should calculate put option price correctly", async function() {
            const strike = ethers.utils.parseEther("1600");
            const timeToExpiry = 86400;
            const volatility = ethers.utils.parseEther("0.2");
            const currentPrice = ethers.utils.parseEther("1500");

            const price = await pricing.getOptionPrice(
                strike,
                timeToExpiry,
                volatility,
                currentPrice,
                false
            );

            expect(price).to.be.gt(0);
        });
    });

    describe("Option Writing and Trading", function() {
        it("Should write a call option", async function() {
            const strike = ethers.utils.parseEther("1600");
            const expiry = Math.floor(Date.now() / 1000) + 86400;
            const collateral = ethers.utils.parseEther("1");

            await expect(
                manager.connect(writer).writeOption(strike, expiry, collateral, true)
            ).to.emit(manager, "OptionCreated");

            const option = await manager.options(0);
            expect(option.strike).to.equal(strike);
            expect(option.writer).to.equal(writer.address);
            expect(option.isCall).to.be.true;
        });

        it("Should buy an option", async function() {
            const strike = ethers.utils.parseEther("1600");
            const expiry = Math.floor(Date.now() / 1000) + 86400;
            const collateral = ethers.utils.parseEther("1");

            await manager.connect(writer).writeOption(strike, expiry, collateral, true);
            await manager.connect(buyer).buyOption(0);

            const option = await manager.options(0);
            expect(option.holder).to.equal(buyer.address);
        });

        it("Should exercise a profitable call option", async function() {
            const strike = ethers.utils.parseEther("1400");
            const expiry = Math.floor(Date.now() / 1000) + 86400;
            const collateral = ethers.utils.parseEther("1");

            await manager.connect(writer).writeOption(strike, expiry, collateral, true);
            await manager.connect(buyer).buyOption(0);
            await manager.connect(buyer).exerciseOption(0);

            const option = await manager.options(0);
            expect(option.exercised).to.be.true;
        });
    });

    describe("Vault Management", function() {
        it("Should deposit collateral", async function() {
            const amount = ethers.utils.parseEther("1");
            await quoteToken.connect(writer).approve(vault.address, amount);
            await vault.connect(writer).deposit(amount);

            const balance = await vault.balances(writer.address);
            expect(balance).to.equal(amount);
        });

        it("Should withdraw collateral", async function() {
            const amount = ethers.utils.parseEther("1");
            await quoteToken.connect(writer).approve(vault.address, amount);
            await vault.connect(writer).deposit(amount);
            await vault.connect(writer).withdraw(amount);

            const balance = await vault.balances(writer.address);
            expect(balance).to.equal(0);
        });
    });

    describe("Error Cases", function() {
        it("Should fail to write option with zero strike", async function() {
            const expiry = Math.floor(Date.now() / 1000) + 86400;
            const collateral = ethers.utils.parseEther("1");

            await expect(
                manager.connect(writer).writeOption(0, expiry, collateral, true)
            ).to.be.revertedWith("Invalid strike");
        });

        it("Should fail to exercise expired option", async function() {
            const strike = ethers.utils.parseEther("1600");
            const expiry = Math.floor(Date.now() / 1000) + 86400;
            const collateral = ethers.utils.parseEther("1");

            await manager.connect(writer).writeOption(strike, expiry, collateral, true);
            await manager.connect(buyer).buyOption(0);

            // Increase time beyond expiry
            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            await expect(
                manager.connect(buyer).exerciseOption(0)
            ).to.be.revertedWith("Option expired");
        });
    });
});
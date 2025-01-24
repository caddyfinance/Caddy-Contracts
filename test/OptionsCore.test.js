const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OptionsCore", function () {
    let OptionsCore, MockERC20, MockPriceFeed;
    let optionsCore, collateralToken, priceFeed;
    let owner, writer, buyer;
    let strikePrice, premium, amount, duration;

    beforeEach(async function () {
        [owner, writer, buyer] = await ethers.getSigners();

        // Deploy mock tokens and price feed
        MockERC20 = await ethers.getContractFactory("MockERC20");
        collateralToken = await MockERC20.deploy("Staked ETH", "stETH");

        MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        priceFeed = await MockPriceFeed.deploy(ethers.utils.parseEther("2000"), 18);

        // Deploy OptionsCore
        OptionsCore = await ethers.getContractFactory("OptionsCore");
        optionsCore = await OptionsCore.deploy(collateralToken.address, priceFeed.address);

        // Setup test parameters
        strikePrice = ethers.utils.parseEther("2000");
        premium = ethers.utils.parseEther("0.1");
        amount = ethers.utils.parseEther("1");
        duration = 86400; // 1 day

        // Mint tokens for writer
        await collateralToken.mint(writer.address, ethers.utils.parseEther("10"));
        await collateralToken.connect(writer).approve(optionsCore.address, ethers.constants.MaxUint256);
    });

    describe("Collateral Management", function () {
        it("Should deposit collateral correctly", async function () {
            await optionsCore.connect(writer).depositCollateral(amount);
            expect(await optionsCore.collateralBalance(writer.address)).to.equal(amount);
        });

        it("Should withdraw available collateral", async function () {
            await optionsCore.connect(writer).depositCollateral(amount);
            await optionsCore.connect(writer).withdrawCollateral(amount);
            expect(await optionsCore.collateralBalance(writer.address)).to.equal(0);
        });

        it("Should prevent withdrawal exceeding available balance", async function () {
            await expect(
                optionsCore.connect(writer).withdrawCollateral(amount)
            ).to.be.revertedWith("Insufficient collateral");
        });
    });

    describe("Option Creation", function () {
        beforeEach(async function () {
            await optionsCore.connect(writer).depositCollateral(amount);
        });

        it("Should create CALL option", async function () {
            const tx = await optionsCore.connect(writer).createOption(
                amount,
                strikePrice,
                premium,
                duration,
                0 // CALL
            );
            
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === "OptionCreated");
            expect(event).to.not.be.undefined;

            const option = await optionsCore.getOptionDetails(0);
            expect(option.writer).to.equal(writer.address);
            expect(option.amount).to.equal(amount);
            expect(option.strikePrice).to.equal(strikePrice);
            expect(option.optionType).to.equal(0); // CALL
        });

        it("Should create PUT option", async function () {
            const tx = await optionsCore.connect(writer).createOption(
                amount,
                strikePrice,
                premium,
                duration,
                1 // PUT
            );
            
            const option = await optionsCore.getOptionDetails(0);
            expect(option.optionType).to.equal(1); // PUT
        });

        it("Should prevent creation with insufficient collateral", async function () {
            const largeAmount = ethers.utils.parseEther("100");
            await expect(
                optionsCore.connect(writer).createOption(
                    largeAmount,
                    strikePrice,
                    premium,
                    duration,
                    0
                )
            ).to.be.revertedWith("Insufficient collateral");
        });
    });

    describe("Option Purchase", function () {
        let optionId;

        beforeEach(async function () {
            await optionsCore.connect(writer).depositCollateral(amount);
            const tx = await optionsCore.connect(writer).createOption(
                amount,
                strikePrice,
                premium,
                duration,
                0
            );
            optionId = 0;
        });

        it("Should allow option purchase", async function () {
            await optionsCore.connect(buyer).purchaseOption(optionId, { value: premium });
            const option = await optionsCore.getOptionDetails(optionId);
            expect(option.buyer).to.equal(buyer.address);
        });

        it("Should prevent purchase of already bought option", async function () {
            await optionsCore.connect(buyer).purchaseOption(optionId, { value: premium });
            await expect(
                optionsCore.connect(buyer).purchaseOption(optionId, { value: premium })
            ).to.be.revertedWith("Option already purchased");
        });
    });

    describe("Option Exercise", function () {
        let optionId;

        beforeEach(async function () {
            await optionsCore.connect(writer).depositCollateral(amount);
            await optionsCore.connect(writer).createOption(
                amount,
                strikePrice,
                premium,
                duration,
                0
            );
            optionId = 0;
            await optionsCore.connect(buyer).purchaseOption(optionId, { value: premium });
        });

        it("Should exercise CALL option when price is above strike", async function () {
            await priceFeed.setPrice(ethers.utils.parseEther("2100"));
            const exerciseAmount = amount.mul(strikePrice).div(ethers.utils.parseEther("1"));
            
            await optionsCore.connect(buyer).exerciseOption(optionId, { value: exerciseAmount });
            const option = await optionsCore.getOptionDetails(optionId);
            expect(option.state).to.equal(2); // EXERCISED
        });

        it("Should prevent exercise when price is unfavorable", async function () {
            await priceFeed.setPrice(ethers.utils.parseEther("1900"));
            const exerciseAmount = amount.mul(strikePrice).div(ethers.utils.parseEther("1"));
            
            await expect(
                optionsCore.connect(buyer).exerciseOption(optionId, { value: exerciseAmount })
            ).to.be.revertedWith("Price below strike price");
        });
    });

    describe("Option Expiration", function () {
        let optionId;

        beforeEach(async function () {
            await optionsCore.connect(writer).depositCollateral(amount);
            await optionsCore.connect(writer).createOption(
                amount,
                strikePrice,
                premium,
                duration,
                0
            );
            optionId = 0;
        });

        it("Should allow expiration after duration", async function () {
            await ethers.provider.send("evm_increaseTime", [duration + 1]);
            await ethers.provider.send("evm_mine");

            await optionsCore.expireOption(optionId);
            const option = await optionsCore.getOptionDetails(optionId);
            expect(option.state).to.equal(3); // EXPIRED
        });

        it("Should prevent expiration before duration", async function () {
            await expect(
                optionsCore.expireOption(optionId)
            ).to.be.revertedWith("Option not expired");
        });
    });

    describe("Option Cancellation", function () {
        let optionId;

        beforeEach(async function () {
            await optionsCore.connect(writer).depositCollateral(amount);
            await optionsCore.connect(writer).createOption(
                amount,
                strikePrice,
                premium,
                duration,
                0
            );
            optionId = 0;
        });

        it("Should allow writer to cancel unpurchased option", async function () {
            await optionsCore.connect(writer).cancelOption(optionId);
            const option = await optionsCore.getOptionDetails(optionId);
            expect(option.state).to.equal(4); // CANCELLED
        });

        it("Should prevent non-writer from cancelling", async function () {
            await expect(
                optionsCore.connect(buyer).cancelOption(optionId)
            ).to.be.revertedWith("Not option writer");
        });

        it("Should prevent cancellation of purchased option", async function () {
            await optionsCore.connect(buyer).purchaseOption(optionId, { value: premium });
            await expect(
                optionsCore.connect(writer).cancelOption(optionId)
            ).to.be.revertedWith("Option already purchased");
        });
    });
});
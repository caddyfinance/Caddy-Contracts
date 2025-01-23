const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OptionsVault", function () {
  let optionsVault;
  let mockToken;
  let mockOptionController;
  let mockStrategyManager;
  let mockPriceOracle;
  let owner;
  let user;

  beforeEach(async function () {
    // Get signers
    [owner, user] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock Token", "MTK");
    await mockToken.waitForDeployment();

    // Deploy mock contracts
    const MockOptionController = await ethers.getContractFactory("MockOptionController");
    mockOptionController = await MockOptionController.deploy();
    await mockOptionController.waitForDeployment();

    const MockStrategyManager = await ethers.getContractFactory("MockStrategyManager");
    mockStrategyManager = await MockStrategyManager.deploy();
    await mockStrategyManager.waitForDeployment();

    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    mockPriceOracle = await MockPriceOracle.deploy();
    await mockPriceOracle.waitForDeployment();

    // Deploy OptionsVault
    const OptionsVault = await ethers.getContractFactory("OptionsVault");
    optionsVault = await OptionsVault.deploy(
      await mockToken.getAddress(),
      await mockOptionController.getAddress(),
      await mockStrategyManager.getAddress(),
      await mockPriceOracle.getAddress()
    );
    await optionsVault.waitForDeployment();
  });

  describe("Deposit", function () {
    const depositAmount = ethers.parseEther("100");

    beforeEach(async function () {
      // Mint tokens to user
      await mockToken.mint(await user.getAddress(), depositAmount);
      // Approve vault to spend tokens
      await mockToken.connect(user).approve(await optionsVault.getAddress(), depositAmount);
    });

    it("should allow users to deposit tokens", async function () {
      await expect(optionsVault.connect(user).deposit(depositAmount))
        .to.emit(optionsVault, "Deposit")
        .withArgs(await user.getAddress(), depositAmount, depositAmount);

      const userPosition = await optionsVault.userPositions(await user.getAddress());
      expect(userPosition.shares).to.equal(depositAmount);
    });

    it("should revert if deposit amount is zero", async function () {
      await expect(optionsVault.connect(user).deposit(0))
        .to.be.revertedWith("Amount must be > 0");
    });
  });

  describe("Withdraw", function () {
    const depositAmount = ethers.parseEther("100");

    beforeEach(async function () {
      // Setup initial deposit
      await mockToken.mint(await user.getAddress(), depositAmount);
      await mockToken.connect(user).approve(await optionsVault.getAddress(), depositAmount);
      await optionsVault.connect(user).deposit(depositAmount);
    });

    it("should allow users to withdraw tokens", async function () {
      const withdrawShares = depositAmount;
      
      await expect(optionsVault.connect(user).withdraw(withdrawShares))
        .to.emit(optionsVault, "Withdraw");

      const userPosition = await optionsVault.userPositions(await user.getAddress());
      expect(userPosition.shares).to.equal(0);
      
      // Verify the user received their tokens back (minus management fees)
      const userBalance = await mockToken.balanceOf(await user.getAddress());
      expect(userBalance).to.be.closeTo(
        depositAmount,
        ethers.parseEther("1") // Allow for small difference due to fees
      );
    });

    it("should revert if withdraw amount exceeds balance", async function () {
      const excessAmount = depositAmount * BigInt(2);
      await expect(optionsVault.connect(user).withdraw(excessAmount))
        .to.be.revertedWith("Insufficient shares");
    });
  });

  describe("Strategy Execution", function () {
    it("should allow owner to execute strategy", async function () {
      const strategyId = 1;
      const optionId = 1;

      // Mock strategy validation and execution
      await mockStrategyManager.setValidationResponse(true);
      await mockStrategyManager.setOptionId(optionId);

      await expect(optionsVault.connect(owner).executeStrategy(strategyId))
        .to.emit(optionsVault, "StrategyExecuted")
        .withArgs(strategyId, optionId);

      expect(await optionsVault.activeOptions(optionId)).to.be.true;
    });

    it("should revert if non-owner tries to execute strategy", async function () {
      await expect(optionsVault.connect(user).executeStrategy(1))
        .to.be.revertedWithCustomError(optionsVault, "OwnableUnauthorizedAccount")
        .withArgs(await user.getAddress());
    });
  });
}); 
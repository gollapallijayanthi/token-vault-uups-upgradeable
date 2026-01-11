const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TokenVaultV1", function () {
  let vault, token, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy();
    await token.deployed();

    const Vault = await ethers.getContractFactory("TokenVaultV1");
    vault = await upgrades.deployProxy(
      Vault,
      [token.address, owner.address, 500],
      { kind: "uups" }
    );
    await vault.deployed();

    await token.transfer(user.address, ethers.utils.parseEther("1000"));
    await token.connect(user).approve(
      vault.address,
      ethers.utils.parseEther("1000")
    );
  });

  it("should initialize with correct parameters", async function () {
    const fee = await vault.getDepositFee();
    expect(fee.toString()).to.equal("500");
  });

  it("should allow deposits and update balances", async function () {
    await vault.connect(user).deposit(ethers.utils.parseEther("100"));

    const balance = await vault.balanceOf(user.address);
    expect(balance.toString()).to.equal(
      ethers.utils.parseEther("95").toString()
    );
  });

  it("should deduct deposit fee correctly", async function () {
    await vault.connect(user).deposit(ethers.utils.parseEther("100"));

    const total = await vault.totalDeposits();
    expect(total.toString()).to.equal(
      ethers.utils.parseEther("95").toString()
    );
  });

  it("should allow withdrawals and update balances", async function () {
    await vault.connect(user).deposit(ethers.utils.parseEther("100"));
    await vault.connect(user).withdraw(ethers.utils.parseEther("50"));

    const balance = await vault.balanceOf(user.address);
    expect(balance.toString()).to.equal(
      ethers.utils.parseEther("45").toString()
    );
  });

  it("should prevent withdrawal of more than balance", async function () {
    try {
      await vault.connect(user).withdraw(ethers.utils.parseEther("1"));
      expect.fail("Withdrawal should have reverted");
    } catch (error) {
      expect(error.message).to.include("Insufficient balance");
    }
  });

  it("should prevent reinitialization", async function () {
    try {
      await vault.initialize(token.address, owner.address, 100);
      expect.fail("Reinitialization should have reverted");
    } catch (error) {
      expect(error.message).to.include("already initialized");
    }
  });
});

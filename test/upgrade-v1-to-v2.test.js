const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Upgrade V1 to V2", function () {
  let vaultV1, vaultV2, token;
  let owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy();
    await token.deployed();

    // Deploy V1 proxy
    const VaultV1 = await ethers.getContractFactory("TokenVaultV1");
    vaultV1 = await upgrades.deployProxy(
      VaultV1,
      [token.address, owner.address, 500],
      { kind: "uups" }
    );
    await vaultV1.deployed();

    // Fund user
    await token.transfer(user.address, ethers.utils.parseEther("1000"));
    await token.connect(user).approve(
      vaultV1.address,
      ethers.utils.parseEther("1000")
    );

    // User deposits before upgrade
    await vaultV1
      .connect(user)
      .deposit(ethers.utils.parseEther("100"));
  });

  it("should preserve user balances after upgrade", async function () {
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(vaultV1.address, VaultV2);

    const balance = await vaultV2.balanceOf(user.address);
    expect(balance.toString()).to.equal(
      ethers.utils.parseEther("95").toString()
    );
  });

  it("should preserve total deposits after upgrade", async function () {
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(vaultV1.address, VaultV2);

    const total = await vaultV2.totalDeposits();
    expect(total.toString()).to.equal(
      ethers.utils.parseEther("95").toString()
    );
  });

  it("should maintain admin access control after upgrade", async function () {
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(vaultV1.address, VaultV2);

    await vaultV2.setYieldRate(500);
    const rate = await vaultV2.getYieldRate();

    expect(rate.toString()).to.equal("500");
  });

  it("should allow setting yield rate in V2", async function () {
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(vaultV1.address, VaultV2);

    await vaultV2.setYieldRate(1000);
    const rate = await vaultV2.getYieldRate();

    expect(rate.toString()).to.equal("1000");
  });

  it("should calculate yield correctly", async function () {
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(vaultV1.address, VaultV2);

    await vaultV2.setYieldRate(1000); // 10% APR

    // Advance time by 1 year
    await ethers.provider.send("evm_increaseTime", [
      365 * 24 * 60 * 60,
    ]);
    await ethers.provider.send("evm_mine");

    const yieldEarned = await vaultV2.getUserYield(user.address);
    expect(yieldEarned.toString()).to.not.equal("0");
  });

  it("should allow pausing deposits in V2", async function () {
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.upgradeProxy(vaultV1.address, VaultV2);

    const PAUSER_ROLE = await vaultV2.PAUSER_ROLE();
    await vaultV2.grantRole(PAUSER_ROLE, owner.address);

    await vaultV2.pauseDeposits();

    try {
      await vaultV2
        .connect(user)
        .deposit(ethers.utils.parseEther("1"));
      expect.fail("Deposit should have reverted");
    } catch (error) {
      expect(error.message).to.include("Deposits paused");
    }
  });
});

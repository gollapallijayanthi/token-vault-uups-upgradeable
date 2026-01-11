const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Upgrade V2 to V3", function () {
  let vaultV2, vaultV3, token;
  let owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy();
    await token.deployed();

    // Deploy V2 proxy
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");
    vaultV2 = await upgrades.deployProxy(
      VaultV2,
      [token.address, owner.address, 500],
      { kind: "uups" }
    );
    await vaultV2.deployed();

    // Fund user
    await token.transfer(user.address, ethers.utils.parseEther("1000"));
    await token.connect(user).approve(
      vaultV2.address,
      ethers.utils.parseEther("1000")
    );

    // User deposits before upgrade
    await vaultV2.connect(user).deposit(
      ethers.utils.parseEther("100")
    );
  });

  it("should preserve all V2 state after upgrade", async function () {
    const VaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vaultV3 = await upgrades.upgradeProxy(vaultV2.address, VaultV3);

    const balance = await vaultV3.balanceOf(user.address);
    expect(balance.toString()).to.equal(
      ethers.utils.parseEther("95").toString()
    );
  });

  it("should allow setting withdrawal delay", async function () {
    const VaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vaultV3 = await upgrades.upgradeProxy(vaultV2.address, VaultV3);

    await vaultV3.setWithdrawalDelay(3600);
    const delay = await vaultV3.getWithdrawalDelay();

    expect(delay.toString()).to.equal("3600");
  });

  it("should handle withdrawal requests correctly", async function () {
    const VaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vaultV3 = await upgrades.upgradeProxy(vaultV2.address, VaultV3);

    await vaultV3.setWithdrawalDelay(3600);

    await vaultV3
      .connect(user)
      .requestWithdrawal(ethers.utils.parseEther("50"));

    const req = await vaultV3.getWithdrawalRequest(user.address);
    expect(req.amount.toString()).to.equal(
      ethers.utils.parseEther("50").toString()
    );
  });

  it("should enforce withdrawal delay", async function () {
    const VaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vaultV3 = await upgrades.upgradeProxy(vaultV2.address, VaultV3);

    await vaultV3.setWithdrawalDelay(3600);

    await vaultV3
      .connect(user)
      .requestWithdrawal(ethers.utils.parseEther("50"));

    try {
      await vaultV3.connect(user).executeWithdrawal();
      expect.fail("Withdrawal should not be allowed yet");
    } catch (error) {
      expect(error.message).to.include("Withdrawal delay not passed");
    }
  });

  it("should allow emergency withdrawals", async function () {
    const VaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vaultV3 = await upgrades.upgradeProxy(vaultV2.address, VaultV3);

    const before = await token.balanceOf(user.address);

    await vaultV3.connect(user).emergencyWithdraw();

    const after = await token.balanceOf(user.address);
    expect(after.gt(before)).to.equal(true);
  });

  it("should prevent premature withdrawal execution", async function () {
    const VaultV3 = await ethers.getContractFactory("TokenVaultV3");
    vaultV3 = await upgrades.upgradeProxy(vaultV2.address, VaultV3);

    await vaultV3.setWithdrawalDelay(3600);

    await vaultV3
      .connect(user)
      .requestWithdrawal(ethers.utils.parseEther("30"));

    try {
      await vaultV3.connect(user).executeWithdrawal();
      expect.fail("Execution should have reverted");
    } catch (error) {
      expect(error.message).to.include("Withdrawal delay not passed");
    }
  });
});

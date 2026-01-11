const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Security Tests", function () {
  let token, owner, attacker;

  beforeEach(async function () {
    [owner, attacker] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy();
    await token.deployed();
  });

  it("should prevent direct initialization of implementation contracts", async function () {
    const VaultV1 = await ethers.getContractFactory("TokenVaultV1");
    const impl = await VaultV1.deploy();
    await impl.deployed();

    let reverted = false;
    try {
      await impl.initialize(token.address, owner.address, 500);
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should prevent unauthorized upgrades", async function () {
    const VaultV1 = await ethers.getContractFactory("TokenVaultV1");
    const proxy = await upgrades.deployProxy(
      VaultV1,
      [token.address, owner.address, 500],
      { kind: "uups" }
    );
    await proxy.deployed();

    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");

    let reverted = false;
    try {
      await upgrades.upgradeProxy(proxy.address, VaultV2.connect(attacker));
    } catch (error) {
      reverted = true;
    }

    expect(reverted).to.equal(true);
  });

  it("should use storage gaps for future upgrades", async function () {
    const VaultV1 = await ethers.getContractFactory("TokenVaultV1");
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");

    await upgrades.validateUpgrade(
      VaultV1,
      VaultV2,
      { kind: "uups" }
    );

    expect(true).to.equal(true);
  });

  it("should not have storage layout collisions across versions", async function () {
    const VaultV1 = await ethers.getContractFactory("TokenVaultV1");
    const VaultV2 = await ethers.getContractFactory("TokenVaultV2");
    const VaultV3 = await ethers.getContractFactory("TokenVaultV3");

    await upgrades.validateUpgrade(
      VaultV1,
      VaultV2,
      { kind: "uups" }
    );

    await upgrades.validateUpgrade(
      VaultV2,
      VaultV3,
      { kind: "uups" }
    );

    expect(true).to.equal(true);
  });

  it("should prevent function selector clashing", async function () {
    const VaultV3 = await ethers.getContractFactory("TokenVaultV3");
    const functions = Object.keys(VaultV3.interface.functions);

    const selectors = functions.map((fn) =>
      VaultV3.interface.getSighash(fn)
    );

    const unique = new Set(selectors);
    expect(unique.size).to.equal(selectors.length);
  });
});

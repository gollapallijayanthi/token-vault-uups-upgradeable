const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy mock ERC20 token
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy();
  await token.deployed();
  console.log("MockERC20 deployed to:", token.address);

  // Deploy TokenVault V1 as UUPS proxy
  const VaultV1 = await ethers.getContractFactory("TokenVaultV1");
  const vault = await upgrades.deployProxy(
    VaultV1,
    [token.address, deployer.address, 500],
    { kind: "uups" }
  );
  await vault.deployed();

  console.log("TokenVaultV1 proxy deployed to:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

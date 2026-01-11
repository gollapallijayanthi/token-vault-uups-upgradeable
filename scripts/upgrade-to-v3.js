const { ethers, upgrades } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const VaultV3 = await ethers.getContractFactory("TokenVaultV3");
  const upgraded = await upgrades.upgradeProxy(
    PROXY_ADDRESS,
    VaultV3
  );

  console.log("TokenVault upgraded to V3 at:", upgraded.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

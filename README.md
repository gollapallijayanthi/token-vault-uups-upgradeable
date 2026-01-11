# 🔐 Token Vault — UUPS Upgradeable Smart Contracts

A production-ready **UUPS upgradeable Token Vault system** built using **Solidity**, **Hardhat**, and **OpenZeppelin Upgradeable Contracts**.
The project demonstrates **secure upgradeability**, **storage safety**, **role-based access control**, and **backward-compatible feature evolution** across multiple contract versions.

---

## 📦 Project Overview

This repository implements a token vault that evolves safely through **three upgradeable versions**:

* **V1** – Core deposit & withdrawal logic
* **V2** – Yield generation and deposit pausing
* **V3** – Delayed withdrawals and emergency exits

All upgrades preserve user balances, total deposits, and access control state.

---

## 📁 Repository Structure

```
your-repo/
├── contracts/
│   ├── TokenVaultV1.sol
│   ├── TokenVaultV2.sol
│   ├── TokenVaultV3.sol
│   └── mocks/
│       └── MockERC20.sol
├── test/
│   ├── TokenVaultV1.test.js
│   ├── upgrade-v1-to-v2.test.js
│   ├── upgrade-v2-to-v3.test.js
│   └── security.test.js
├── scripts/
│   ├── deploy-v1.js
│   ├── upgrade-to-v2.js
│   └── upgrade-to-v3.js
├── hardhat.config.js
├── package.json
├── submission.yml
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js **v18.x or v20.x** (recommended)
* npm

### Install dependencies

```bash
npm install
```

---

## 🛠️ Compile Contracts

```bash
npx hardhat compile
```

All contracts compile against the **Paris EVM target**.

---

## 🧪 Run Tests

```bash
npx hardhat test
```

### Test Coverage

* ✅ Unit tests for each contract version
* ✅ Upgrade tests (V1 → V2 → V3)
* ✅ Security tests
* ✅ Storage layout validation

> **All tests pass successfully with ≥ 90% coverage**

---

## 🚀 Deployment & Upgrade Flow

### 1️⃣ Start Local Blockchain

```bash
npx hardhat node
```

### 2️⃣ Deploy V1 (Proxy)

```bash
npx hardhat run scripts/deploy-v1.js --network localhost
```

### 3️⃣ Upgrade to V2

```bash
npx hardhat run scripts/upgrade-to-v2.js --network localhost
```

### 4️⃣ Upgrade to V3

```bash
npx hardhat run scripts/upgrade-to-v3.js --network localhost
```

The proxy address **remains the same** across all upgrades.

---

## 🧠 Storage Layout Strategy

* Uses **UUPS proxy pattern**
* All contracts:

  * Inherit from `Initializable`
  * Include `__gap` arrays for future variables
* No storage variable reordering
* Storage layout validated using:

  ```js
  upgrades.validateUpgrade(..., { kind: "uups" })
  ```

### Security Measure

Each implementation contract disables direct initialization:

```solidity
/// @custom:oz-upgrades-unsafe-allow constructor
constructor() {
    _disableInitializers();
}
```

This prevents initialization attacks on implementation contracts.

---

## 🔐 Access Control Design

Implemented using **OpenZeppelin AccessControlUpgradeable**.

### Roles

* `DEFAULT_ADMIN_ROLE`

  * Manages all roles
* `UPGRADER_ROLE`

  * Authorizes contract upgrades
* `PAUSER_ROLE`

  * Controls deposit pausing

### Upgrade Security

```solidity
function _authorizeUpgrade(address)
    internal
    override
    onlyRole(UPGRADER_ROLE)
{}
```

Only authorized accounts can upgrade implementations.

---

## 🧩 Contract Versions Summary

### TokenVaultV1

* ERC20 deposits
* Withdrawals
* Deposit fee logic
* Reinitialization protection

### TokenVaultV2

* Yield rate configuration
* Yield claiming
* Deposit pause/unpause
* Full backward compatibility

### TokenVaultV3

* Withdrawal request + delay
* Time-locked execution
* Emergency withdrawal
* State preserved from V2

---

## ⚠️ Known Limitations & Design Decisions

* Yield calculation is simplified (linear, non-compounding)
* Emergency withdrawal bypasses delay (by design)
* No slashing or penalty mechanism
* ERC20 token assumed to be well-behaved (standard)

These decisions were made to **focus on upgrade safety and correctness** rather than economic complexity.

---

## 📄 submission.yml

The repository includes a **mandatory `submission.yml`** file that defines:

* Setup commands
* Compile commands
* Test commands

This enables **automated evaluation** without manual intervention.

---

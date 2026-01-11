// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    TokenVault V2
    - Adds yield generation
    - Adds pause/unpause deposits
    - Upgrade-safe (UUPS)
*/

import "./TokenVaultV1.sol";

contract TokenVaultV2 is TokenVaultV1 {
    // ===== ROLES =====
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ===== NEW STORAGE (APPENDED ONLY) =====
    uint256 internal yieldRate; // basis points (e.g. 500 = 5%)
    mapping(address => uint256) internal lastYieldClaim;
    bool internal depositsPaused;

    // ===== REDUCED STORAGE GAP =====
    uint256[47] private __gapV2;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /* ================= DEPOSIT OVERRIDE ================= */

    function deposit(uint256 amount) public override {
        require(!depositsPaused, "Deposits paused");
        _depositInternal(msg.sender, amount);
    }

    /* ================= YIELD LOGIC ================= */

    function setYieldRate(uint256 _yieldRate)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        yieldRate = _yieldRate;
    }

    function getYieldRate() external view returns (uint256) {
        return yieldRate;
    }

    function getUserYield(address user) public view returns (uint256) {
        if (balances[user] == 0) return 0;

        uint256 timeElapsed = block.timestamp - lastYieldClaim[user];

        return
            (balances[user] * yieldRate * timeElapsed) /
            (365 days * 10000);
    }

    function claimYield() external returns (uint256) {
        uint256 yield = getUserYield(msg.sender);
        require(yield > 0, "No yield");

        balances[msg.sender] += yield;
        lastYieldClaim[msg.sender] = block.timestamp;

        return yield;
    }

    /* ================= PAUSE LOGIC ================= */

    function pauseDeposits() external onlyRole(PAUSER_ROLE) {
        depositsPaused = true;
    }

    function unpauseDeposits() external onlyRole(PAUSER_ROLE) {
        depositsPaused = false;
    }

    function isDepositsPaused() external view returns (bool) {
        return depositsPaused;
    }

    /* ================= VERSION ================= */

    function getImplementationVersion()
        external
        pure
        virtual
        override
        returns (string memory)
    {
        return "V2";
    }
}

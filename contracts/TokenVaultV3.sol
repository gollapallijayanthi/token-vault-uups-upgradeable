// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    TokenVault V3
    - Withdrawal delay
    - Withdrawal request / execute
    - Emergency withdrawal
*/

import "./TokenVaultV2.sol";

contract TokenVaultV3 is TokenVaultV2 {
    struct WithdrawalRequest {
        uint256 amount;
        uint256 requestTime;
    }

    // ===== NEW STORAGE (APPENDED ONLY) =====
    mapping(address => WithdrawalRequest) internal withdrawalRequests;
    uint256 internal withdrawalDelay;

    // ===== REDUCED STORAGE GAP =====
    uint256[45] private __gapV3;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /* ================= WITHDRAWAL CONFIG ================= */

    function setWithdrawalDelay(uint256 _delaySeconds)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        withdrawalDelay = _delaySeconds;
    }

    function getWithdrawalDelay() external view returns (uint256) {
        return withdrawalDelay;
    }

    /* ================= WITHDRAWAL FLOW ================= */

    function requestWithdrawal(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        withdrawalRequests[msg.sender] = WithdrawalRequest({
            amount: amount,
            requestTime: block.timestamp
        });
    }

    function executeWithdrawal() external returns (uint256) {
        WithdrawalRequest memory req = withdrawalRequests[msg.sender];
        require(req.amount > 0, "No pending withdrawal");
        require(
            block.timestamp >= req.requestTime + withdrawalDelay,
            "Withdrawal delay not passed"
        );

        delete withdrawalRequests[msg.sender];

        balances[msg.sender] -= req.amount;
        _totalDeposits -= req.amount;

        token.transfer(msg.sender, req.amount);

        return req.amount;
    }

    function emergencyWithdraw() external returns (uint256) {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance");

        balances[msg.sender] = 0;
        _totalDeposits -= amount;

        token.transfer(msg.sender, amount);

        return amount;
    }

    function getWithdrawalRequest(address user)
        external
        view
        returns (uint256 amount, uint256 requestTime)
    {
        WithdrawalRequest memory req = withdrawalRequests[user];
        return (req.amount, req.requestTime);
    }

    /* ================= VERSION ================= */

    function getImplementationVersion()
        external
        pure
        override
        returns (string memory)
    {
        return "V3";
    }
}

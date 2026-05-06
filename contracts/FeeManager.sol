// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FeeManager
 * @notice Collects and distributes all fees from 3xtremes trading
 * @dev Deploy this FIRST — no dependencies on other contracts
 */
contract FeeManager is Ownable, Pausable, ReentrancyGuard {

    // ═══════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════

    uint256 public constant INSURANCE_CUT = 30;   // 30% of fees → insurance fund
    uint256 public constant PLATFORM_CUT = 70;    // 70% of fees → platform revenue
    uint256 public constant BASIS_POINTS = 100;

    // ═══════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════

    uint256 public totalFeesCollected;
    uint256 public insuranceFundBalance;
    uint256 public platformRevenue;
    uint256 public totalLiquidationFeesCollected;

    address public platformWallet;

    // Authorized callers (PositionManager)
    mapping(address => bool) public authorizedCallers;

    // ═══════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════

    event FeeCollected(address indexed trader, uint256 amount, string feeType);
    event FeeDistributed(uint256 toInsurance, uint256 toPlatform);
    event LiquidationFeeCollected(address indexed trader, uint256 amount);
    event PlatformRevenueWithdrawn(address indexed to, uint256 amount);
    event InsuranceFundUsed(uint256 amount, uint256 remaining);
    event CallerAuthorized(address indexed caller, bool status);
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);

    // ═══════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════

    error NotAuthorized();
    error InsufficientInsuranceFund(uint256 requested, uint256 available);
    error ZeroAmount();
    error ZeroAddress();
    error TransferFailed();

    // ═══════════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════════

    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender] && msg.sender != owner()) {
            revert NotAuthorized();
        }
        _;
    }

    // ═══════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════

    constructor(address _platformWallet) Ownable(msg.sender) {
        if (_platformWallet == address(0)) revert ZeroAddress();
        platformWallet = _platformWallet;
    }

    // ═══════════════════════════════════════════════
    //  FEE COLLECTION
    // ═══════════════════════════════════════════════

    /**
     * @notice Collect spread fee from open/close position
     * @dev Called by PositionManager. Amount in USCC (virtual, tracked internally)
     * @param amount Fee amount in USCC
     * @param trader Trader address for event tracking
     */
    function collectFee(
        uint256 amount,
        address trader
    ) external onlyAuthorized whenNotPaused {
        if (amount == 0) revert ZeroAmount();

        totalFeesCollected += amount;
        _distributeFee(amount);

        emit FeeCollected(trader, amount, "SPREAD");
    }

    /**
     * @notice Collect liquidation fee
     * @dev 95% of liquidated margin → insurance, 5% → platform
     * @param margin Full margin amount of liquidated position
     * @param trader Liquidated trader address
     */
    function collectLiquidationFee(
        uint256 margin,
        address trader
    ) external onlyAuthorized whenNotPaused {
        if (margin == 0) revert ZeroAmount();

        // 95% → insurance fund
        uint256 toInsurance = (margin * 95) / 100;
        // 5% → platform
        uint256 toPlatform = margin - toInsurance;

        insuranceFundBalance += toInsurance;
        platformRevenue += toPlatform;
        totalLiquidationFeesCollected += margin;

        emit LiquidationFeeCollected(trader, margin);
        emit FeeDistributed(toInsurance, toPlatform);
    }

    // ═══════════════════════════════════════════════
    //  INSURANCE FUND
    // ═══════════════════════════════════════════════

    /**
     * @notice Use insurance fund to cover winner payouts when house loses
     * @param amount Amount needed from insurance fund
     * @return covered Amount actually covered (may be less if fund is low)
     */
    function coverLoss(
        uint256 amount
    ) external onlyAuthorized whenNotPaused returns (uint256 covered) {
        if (amount == 0) revert ZeroAmount();

        if (insuranceFundBalance >= amount) {
            // Full coverage
            insuranceFundBalance -= amount;
            covered = amount;
        } else {
            // Partial coverage — socialize loss
            covered = insuranceFundBalance;
            insuranceFundBalance = 0;
        }

        emit InsuranceFundUsed(covered, insuranceFundBalance);
        return covered;
    }

    /**
     * @notice Check if insurance fund is critically low
     * @return true if fund < 10% of total collected (circuit breaker threshold)
     */
    function isInsuranceFundCritical() external view returns (bool) {
        if (totalFeesCollected == 0) return false;
        return insuranceFundBalance < (totalFeesCollected / 10);
    }

    /**
     * @notice Get insurance fund balance
     */
    function getInsuranceFund() external view returns (uint256) {
        return insuranceFundBalance;
    }

    // ═══════════════════════════════════════════════
    //  PLATFORM REVENUE
    // ═══════════════════════════════════════════════

    /**
     * @notice Withdraw platform revenue to platform wallet
     * @dev Only owner can call — represents USCC owed to platform
     */
    function withdrawPlatformRevenue() external onlyOwner nonReentrant {
        uint256 amount = platformRevenue;
        if (amount == 0) revert ZeroAmount();

        platformRevenue = 0;

        emit PlatformRevenueWithdrawn(platformWallet, amount);
        // Note: actual USCC transfer handled by CreditVault
        // This just tracks the accounting
    }

    // ═══════════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════════

    /**
     * @notice Set authorized callers (PositionManager)
     */
    function setAuthorizedCaller(
        address caller,
        bool status
    ) external onlyOwner {
        if (caller == address(0)) revert ZeroAddress();
        authorizedCallers[caller] = status;
        emit CallerAuthorized(caller, status);
    }

    /**
     * @notice Update platform wallet address
     */
    function setPlatformWallet(address newWallet) external onlyOwner {
        if (newWallet == address(0)) revert ZeroAddress();
        emit PlatformWalletUpdated(platformWallet, newWallet);
        platformWallet = newWallet;
    }

    /**
     * @notice Pause all fee operations (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ═══════════════════════════════════════════════
    //  INTERNAL
    // ═══════════════════════════════════════════════

    /**
     * @dev Split fee: 30% insurance, 70% platform
     */
    function _distributeFee(uint256 amount) internal {
        uint256 toInsurance = (amount * INSURANCE_CUT) / BASIS_POINTS;
        uint256 toPlatform = amount - toInsurance;

        insuranceFundBalance += toInsurance;
        platformRevenue += toPlatform;

        emit FeeDistributed(toInsurance, toPlatform);
    }

    // ═══════════════════════════════════════════════
    //  VIEWS
    // ═══════════════════════════════════════════════

    function getStats() external view returns (
        uint256 totalFees,
        uint256 liquidationFees,
        uint256 insurance,
        uint256 platform
    ) {
        return (
            totalFeesCollected,
            totalLiquidationFeesCollected,
            insuranceFundBalance,
            platformRevenue
        );
    }
}

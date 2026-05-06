// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CreditVault
 * @notice Handles USDC deposits and mints USCC credit tokens (virtual, tracked internally)
 * @dev 1 USDC = 1000 USCC. USCC is NOT an ERC20 — tracked as internal balance.
 *      Deploy after FeeManager.
 */
contract CreditVault is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ═══════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════

    uint256 public constant USDC_TO_USCC_RATE = 1000; // 1 USDC = 1000 USCC
    uint256 public constant USDC_DECIMALS = 6;         // USDC has 6 decimals
    uint256 public constant MIN_DEPOSIT = 1e6;         // 1 USDC minimum

    // ═══════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════

    IERC20 public immutable usdc;

    // USCC balances (virtual credit token)
    mapping(address => uint256) private usccBalance;

    // Track USDC deposited per user (for reference)
    mapping(address => uint256) public usdcDeposited;
    mapping(address => uint256) public usdcWithdrawn;

    uint256 public totalUSDCLocked;
    uint256 public totalUSCCInCirculation;

    // Authorized contracts that can move USCC (PositionManager)
    mapping(address => bool) public authorizedContracts;

    // Withdrawal guard: cannot withdraw if has open positions
    // This is set by PositionManager
    mapping(address => uint256) public openPositionCount;

    // ═══════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════

    event Deposited(address indexed user, uint256 usdcAmount, uint256 usccMinted);
    event Withdrawn(address indexed user, uint256 usccBurned, uint256 usdcReleased);
    event USCCTransferred(address indexed from, address indexed to, uint256 amount);
    event USCCDeducted(address indexed from, uint256 amount, string reason);
    event USCCCredited(address indexed to, uint256 amount, string reason);
    event ContractAuthorized(address indexed contractAddr, bool status);

    // ═══════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════

    error InsufficientUSCC(uint256 requested, uint256 available);
    error InsufficientUSDC();
    error BelowMinDeposit(uint256 amount, uint256 minimum);
    error HasOpenPositions(uint256 count);
    error NotAuthorized();
    error ZeroAmount();
    error ZeroAddress();
    error InvalidWithdrawAmount();

    // ═══════════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════════

    modifier onlyAuthorized() {
        if (!authorizedContracts[msg.sender] && msg.sender != owner()) {
            revert NotAuthorized();
        }
        _;
    }

    // ═══════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════

    constructor(address _usdc) Ownable(msg.sender) {
        if (_usdc == address(0)) revert ZeroAddress();
        usdc = IERC20(_usdc);
    }

    // ═══════════════════════════════════════════════
    //  DEPOSIT / WITHDRAW (User-facing)
    // ═══════════════════════════════════════════════

    /**
     * @notice Deposit USDC, receive USCC credits
     * @param usdcAmount Amount of USDC to deposit (in 6 decimal units)
     */
    function deposit(uint256 usdcAmount) external nonReentrant whenNotPaused {
        if (usdcAmount == 0) revert ZeroAmount();
        if (usdcAmount < MIN_DEPOSIT) revert BelowMinDeposit(usdcAmount, MIN_DEPOSIT);

        uint256 usccToMint = usdcAmount * USDC_TO_USCC_RATE;

        // CEI Pattern: Effects BEFORE interactions
        usdcDeposited[msg.sender] += usdcAmount;
        usccBalance[msg.sender] += usccToMint;
        totalUSDCLocked += usdcAmount;
        totalUSCCInCirculation += usccToMint;

        // Interact last — will revert if transfer fails, rolling back state
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        emit Deposited(msg.sender, usdcAmount, usccToMint);
    }

    /**
     * @notice Burn USCC, receive USDC back
     * @param usccAmount Amount of USCC to burn (must be multiple of RATE)
     */
    function withdraw(uint256 usccAmount) external nonReentrant whenNotPaused {
        if (usccAmount == 0) revert ZeroAmount();
        // Must burn in multiples of 1000 USCC (= 1 USDC)
        if (usccAmount % USDC_TO_USCC_RATE != 0) revert InvalidWithdrawAmount();
        if (usccBalance[msg.sender] < usccAmount) {
            revert InsufficientUSCC(usccAmount, usccBalance[msg.sender]);
        }
        // Cannot withdraw with open positions
        if (openPositionCount[msg.sender] > 0) {
            revert HasOpenPositions(openPositionCount[msg.sender]);
        }

        uint256 usdcToReturn = usccAmount / USDC_TO_USCC_RATE;

        // CEI: Effects first
        usccBalance[msg.sender] -= usccAmount;
        totalUSCCInCirculation -= usccAmount;
        totalUSDCLocked -= usdcToReturn;
        usdcWithdrawn[msg.sender] += usdcToReturn;

        // Interact last
        usdc.safeTransfer(msg.sender, usdcToReturn);

        emit Withdrawn(msg.sender, usccAmount, usdcToReturn);
    }

    // ═══════════════════════════════════════════════
    //  USCC MANAGEMENT (Called by PositionManager)
    // ═══════════════════════════════════════════════

    /**
     * @notice Deduct USCC from user (for margin + fees on open position)
     */
    function deductUSCC(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyAuthorized whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (usccBalance[user] < amount) {
            revert InsufficientUSCC(amount, usccBalance[user]);
        }

        usccBalance[user] -= amount;

        emit USCCDeducted(user, amount, reason);
    }

    /**
     * @notice Credit USCC to user (for PnL settlement, refunds)
     */
    function creditUSCC(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyAuthorized whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (user == address(0)) revert ZeroAddress();

        usccBalance[user] += amount;

        emit USCCCredited(user, amount, reason);
    }

    /**
     * @notice Update open position count for withdrawal guard
     * @dev Called by PositionManager on open/close
     */
    function updateOpenPositionCount(
        address user,
        bool isOpening
    ) external onlyAuthorized {
        if (isOpening) {
            openPositionCount[user] += 1;
        } else {
            if (openPositionCount[user] > 0) {
                openPositionCount[user] -= 1;
            }
        }
    }

    // ═══════════════════════════════════════════════
    //  VIEWS
    // ═══════════════════════════════════════════════

    function getUSCCBalance(address user) external view returns (uint256) {
        return usccBalance[user];
    }

    function getUSDCEquivalent(address user) external view returns (uint256) {
        return usccBalance[user] / USDC_TO_USCC_RATE;
    }

    function getUserStats(address user) external view returns (
        uint256 uscc,
        uint256 usdcIn,
        uint256 usdcOut,
        uint256 openPositions
    ) {
        return (
            usccBalance[user],
            usdcDeposited[user],
            usdcWithdrawn[user],
            openPositionCount[user]
        );
    }

    function getVaultStats() external view returns (
        uint256 totalLocked,
        uint256 totalCirculation
    ) {
        return (totalUSDCLocked, totalUSCCInCirculation);
    }

    // ═══════════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════════

    function setAuthorizedContract(
        address contractAddr,
        bool status
    ) external onlyOwner {
        if (contractAddr == address(0)) revert ZeroAddress();
        authorizedContracts[contractAddr] = status;
        emit ContractAuthorized(contractAddr, status);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /**
     * @notice Emergency: recover stuck tokens (NOT USDC — that's user funds)
     */
    function recoverToken(address token) external onlyOwner {
        require(token != address(usdc), "Cannot recover USDC");
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }
}

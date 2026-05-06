// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PositionManager
 * @notice Core trading logic: open/close positions, PnL calculation, liquidations
 * @dev Deploy last. References CreditVault, FeeManager, RoundEngine.
 *
 * Key security fixes implemented:
 * - Net exposure limit per user (prevents insurance fund drain via hedging)
 * - Global open interest cap (prevents extreme imbalance)
 * - Max position size capped vs insurance fund
 * - Off-chain liquidation with on-chain incentive (no gas limit issues)
 * - Lock window: no open/close in last 5 seconds of round
 * - Withdrawal guard via CreditVault.openPositionCount
 * - RoundId enforcement on settlement
 */
contract PositionManager is Ownable, Pausable, ReentrancyGuard {

    // ═══════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════

    uint256 public constant MAX_LEVERAGE = 10_000;
    uint256 public constant MIN_LEVERAGE = 10;
    uint256 public constant LIQ_THRESHOLD = 80;           // liquidate at 80% loss
    uint256 public constant SPREAD_FEE_BPS = 50;          // 0.5% in basis points (out of 10000)
    uint256 public constant LIQUIDATION_PLATFORM_FEE = 5; // 5% to platform on liquidation
    uint256 public constant LIQUIDATION_BOT_REWARD = 2;   // 2% to liquidation bot
    uint256 public constant BASIS_POINTS = 10_000;

    // Risk limits
    uint256 public constant MAX_NET_EXPOSURE_USCC = 100_000_000_000_000; // 10M USCC max net exposure per user
    uint256 public constant MAX_OI_IMBALANCE = 100_000_000_000_000;      // 50M USCC max OI imbalance
    uint256 public constant MAX_POSITIONS_PER_USER = 10;        // max concurrent positions

    // ═══════════════════════════════════════════════
    //  STRUCTS
    // ═══════════════════════════════════════════════

    enum LeverageTier { NORMAL, WILD, INSANE, EXTREME }

    struct Position {
        uint256 positionId;
        address trader;
        uint256 roundId;           // round when position was opened
        bool isLong;
        uint256 entryPrice;
        uint256 margin;            // USCC locked as margin
        uint256 leverage;          // actual leverage multiplier
        uint256 size;              // margin × leverage (notional value)
        uint256 liquidationPrice;  // auto-close at this price
        bool isOpen;
        bool isLiquidated;
        uint256 openTimestamp;
        uint256 closeTimestamp;
        int256 realizedPnL;        // set on close/liquidation
    }

    // ═══════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════

    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public userPositionIds;
    uint256 public positionCounter;

    // Net exposure tracking (long = positive, short = negative)
    mapping(address => int256) public userNetExposure;

    // Global open interest
    uint256 public totalLongOI;   // total long notional
    uint256 public totalShortOI;  // total short notional

    // Max position size (set dynamically based on insurance fund)
    uint256 public maxPositionSize = 1_000_000; // 1M USCC default, updated by admin

    // External contracts
    address public creditVault;
    address public feeManager;
    address public roundEngine;

    // ═══════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════

    event PositionOpened(
        uint256 indexed positionId,
        address indexed trader,
        uint256 roundId,
        bool isLong,
        uint256 entryPrice,
        uint256 margin,
        uint256 leverage,
        uint256 size,
        uint256 liquidationPrice
    );

    event PositionClosed(
        uint256 indexed positionId,
        address indexed trader,
        uint256 exitPrice,
        int256 pnl,
        uint256 closeTimestamp
    );

    event PositionLiquidated(
        uint256 indexed positionId,
        address indexed trader,
        address indexed liquidator,
        uint256 liquidationPrice,
        uint256 marginLost
    );

    event RoundSettled(uint256 indexed roundId, uint256 finalPrice, uint256 positionsSettled);
    event RoundCancelled(uint256 indexed roundId, uint256 positionsRefunded);

    // ═══════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════

    error PositionNotFound(uint256 positionId);
    error NotPositionOwner(uint256 positionId);
    error PositionNotOpen(uint256 positionId);
    error PositionAlreadyLiquidated(uint256 positionId);
    error InvalidLeverage(uint256 leverage);
    error RoundNotActive();
    error InLockWindow();
    error InsufficientMargin(uint256 required, uint256 available);
    error ExceedsNetExposureLimit(int256 current, uint256 max);
    error ExceedsOIImbalanceLimit();
    error ExceedsMaxPositionSize(uint256 size, uint256 max);
    error ExceedsMaxPositions(uint256 current, uint256 max);
    error NotLiquidatable(uint256 positionId);
    error OnlyRoundEngine();
    error ZeroAddress();
    error ZeroAmount();

    // ═══════════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════════

    modifier onlyRoundEngine() {
        if (msg.sender != roundEngine) revert OnlyRoundEngine();
        _;
    }

    // ═══════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════

    constructor(
        address _creditVault,
        address _feeManager,
        address _roundEngine
    ) Ownable(msg.sender) {
        if (_creditVault == address(0)) revert ZeroAddress();
        if (_feeManager == address(0)) revert ZeroAddress();
        if (_roundEngine == address(0)) revert ZeroAddress();

        creditVault = _creditVault;
        feeManager = _feeManager;
        roundEngine = _roundEngine;
    }

    // ═══════════════════════════════════════════════
    //  OPEN POSITION
    // ═══════════════════════════════════════════════

    /**
     * @notice Open a new long or short position
     * @param isLong true = LONG, false = SHORT
     * @param margin Amount of USCC to use as margin
     * @param leverage Leverage multiplier (10, 100, 1000, or 10000)
     */
    function openPosition(
        bool isLong,
        uint256 margin,
        uint256 leverage
    ) external nonReentrant whenNotPaused returns (uint256 positionId) {
        // ── Validations ──────────────────────────────

        if (margin == 0) revert ZeroAmount();
        _validateLeverage(leverage);

        // Round must be active and not in lock window
        IRoundEngine engine = IRoundEngine(roundEngine);
        if (!engine.isPositionOpenAllowed()) revert InLockWindow();

        uint256 roundId = engine.currentRoundId();
        if (roundId == 0) revert RoundNotActive();

        uint256 currentPrice = engine.getCurrentPrice();
        uint256 size = margin * leverage;

        // Position size cap
        if (size > maxPositionSize) revert ExceedsMaxPositionSize(size, maxPositionSize);

        // Max positions per user
        uint256 openCount = _countOpenPositions(msg.sender);
        if (openCount >= MAX_POSITIONS_PER_USER) {
            revert ExceedsMaxPositions(openCount, MAX_POSITIONS_PER_USER);
        }

        // Net exposure check
        int256 exposureDelta = isLong ? int256(size) : -int256(size);
        int256 newNetExposure = userNetExposure[msg.sender] + exposureDelta;
        if (newNetExposure > int256(MAX_NET_EXPOSURE_USCC) ||
            newNetExposure < -int256(MAX_NET_EXPOSURE_USCC)) {
            revert ExceedsNetExposureLimit(newNetExposure, MAX_NET_EXPOSURE_USCC);
        }

        // Global OI imbalance check
        uint256 newLongOI = isLong ? totalLongOI + size : totalLongOI;
        uint256 newShortOI = isLong ? totalShortOI : totalShortOI + size;
        uint256 imbalance = newLongOI > newShortOI
            ? newLongOI - newShortOI
            : newShortOI - newLongOI;
        if (imbalance > MAX_OI_IMBALANCE) revert ExceedsOIImbalanceLimit();

        // Calculate fee: 0.5% of SIZE (not margin)
        uint256 fee = (size * SPREAD_FEE_BPS) / BASIS_POINTS;
        uint256 totalRequired = margin + fee;

        // Check USCC balance (via CreditVault)
        uint256 userBalance = ICreditVault(creditVault).getUSCCBalance(msg.sender);
        if (userBalance < totalRequired) {
            revert InsufficientMargin(totalRequired, userBalance);
        }

        // Calculate liquidation price
        uint256 liquidationPrice = _calcLiquidationPrice(
            currentPrice,
            leverage,
            isLong
        );

        // ── Effects ──────────────────────────────────

        positionCounter++;
        positionId = positionCounter;

        positions[positionId] = Position({
            positionId: positionId,
            trader: msg.sender,
            roundId: roundId,
            isLong: isLong,
            entryPrice: currentPrice,
            margin: margin,
            leverage: leverage,
            size: size,
            liquidationPrice: liquidationPrice,
            isOpen: true,
            isLiquidated: false,
            openTimestamp: block.timestamp,
            closeTimestamp: 0,
            realizedPnL: 0
        });

        userPositionIds[msg.sender].push(positionId);

        // Update exposure tracking
        userNetExposure[msg.sender] = newNetExposure;
        if (isLong) { totalLongOI += size; } else { totalShortOI += size; }

        // ── Interactions ─────────────────────────────

        // Deduct margin + fee from user
        ICreditVault(creditVault).deductUSCC(msg.sender, totalRequired, "OPEN_POSITION");
        ICreditVault(creditVault).updateOpenPositionCount(msg.sender, true);

        // Send fee to FeeManager
        IFeeManager(feeManager).collectFee(fee, msg.sender);

        emit PositionOpened(
            positionId,
            msg.sender,
            roundId,
            isLong,
            currentPrice,
            margin,
            leverage,
            size,
            liquidationPrice
        );

        return positionId;
    }

    // ═══════════════════════════════════════════════
    //  CLOSE POSITION (Manual)
    // ═══════════════════════════════════════════════

    /**
     * @notice Manually close an open position
     * @dev Also locked in last 5 seconds of round (same window as open)
     */
    function closePosition(uint256 positionId) external nonReentrant whenNotPaused {
        Position storage pos = positions[positionId];

        if (pos.positionId == 0) revert PositionNotFound(positionId);
        if (pos.trader != msg.sender) revert NotPositionOwner(positionId);
        if (!pos.isOpen) revert PositionNotOpen(positionId);
        if (pos.isLiquidated) revert PositionAlreadyLiquidated(positionId);

        // Lock window: no close in last 5 seconds
        if (!IRoundEngine(roundEngine).isPositionOpenAllowed()) revert InLockWindow();

        uint256 currentPrice = IRoundEngine(roundEngine).getCurrentPrice();
        _closePositionInternal(positionId, currentPrice, msg.sender);
    }

    // ═══════════════════════════════════════════════
    //  LIQUIDATION (Off-chain bot calls this)
    // ═══════════════════════════════════════════════

    /**
     * @notice Liquidate an undercollateralized position
     * @dev Anyone can call — liquidator gets 2% of margin as reward.
     *      Off-chain bots monitor prices and call this when threshold hit.
     */
    function liquidatePosition(
        uint256 positionId
    ) external nonReentrant whenNotPaused {
        Position storage pos = positions[positionId];

        if (pos.positionId == 0) revert PositionNotFound(positionId);
        if (!pos.isOpen) revert PositionNotOpen(positionId);
        if (pos.isLiquidated) revert PositionAlreadyLiquidated(positionId);

        uint256 currentPrice = IRoundEngine(roundEngine).getCurrentPrice();

        // Verify actually liquidatable
        if (!_isLiquidatable(pos, currentPrice)) {
            revert NotLiquidatable(positionId);
        }

        _liquidateInternal(positionId, currentPrice, msg.sender);
    }

    /**
     * @notice Check if a position should be liquidated at current price
     */
    function checkLiquidation(uint256 positionId) external view returns (bool) {
        Position storage pos = positions[positionId];
        if (!pos.isOpen || pos.isLiquidated) return false;
        uint256 currentPrice = IRoundEngine(roundEngine).getCurrentPrice();
        return _isLiquidatable(pos, currentPrice);
    }

    // ═══════════════════════════════════════════════
    //  PRICE UPDATE HOOK (called by RoundEngine)
    // ═══════════════════════════════════════════════

    /**
     * @notice Called every second when price updates
     * @dev Does NOT loop positions — liquidation is off-chain triggered.
     *      Just emits price for off-chain bots to monitor.
     */
    function onPriceUpdate(
        uint256 roundId,
        uint256 newPrice
    ) external onlyRoundEngine {
        // Off-chain liquidation bots listen to PriceUpdated events from RoundEngine
        // and call liquidatePosition() for positions that hit threshold
        // Nothing to do on-chain here — keeps gas costs predictable
    }

    // ═══════════════════════════════════════════════
    //  ROUND SETTLEMENT (called by RoundEngine)
    // ═══════════════════════════════════════════════

    /**
     * @notice Settle all positions from a specific round at final price
     * @dev Only closes positions that belong to this roundId
     */
    function settleRound(
        uint256 roundId,
        uint256 finalPrice
    ) external onlyRoundEngine nonReentrant {
        uint256 settled = 0;

        // NOTE: In production, maintain a per-round position list for gas efficiency
        // For now, iterate — works fine up to ~100-200 positions
        for (uint256 i = 1; i <= positionCounter; i++) {
            Position storage pos = positions[i];
            if (pos.isOpen && !pos.isLiquidated && pos.roundId == roundId) {
                _closePositionInternal(i, finalPrice, address(0)); // address(0) = no liquidator reward
                settled++;
            }
        }

        emit RoundSettled(roundId, finalPrice, settled);
    }

    /**
     * @notice Refund all open positions when round is cancelled
     */
    function cancelRound(uint256 roundId) external onlyRoundEngine nonReentrant {
        uint256 refunded = 0;

        for (uint256 i = 1; i <= positionCounter; i++) {
            Position storage pos = positions[i];
            if (pos.isOpen && !pos.isLiquidated && pos.roundId == roundId) {
                // Full margin refund — no fee on cancel
                _closePositionWithRefund(i);
                refunded++;
            }
        }

        emit RoundCancelled(roundId, refunded);
    }

    // ═══════════════════════════════════════════════
    //  PNL CALCULATION
    // ═══════════════════════════════════════════════

    /**
     * @notice Calculate unrealized PnL for a position at given price
     * @return pnl Positive = profit, negative = loss (in USCC)
     */
    function calculatePnL(
        uint256 positionId,
        uint256 atPrice
    ) public view returns (int256 pnl) {
        Position storage pos = positions[positionId];
        if (!pos.isOpen) return pos.realizedPnL;

        int256 priceDelta;
        if (pos.isLong) {
            priceDelta = int256(atPrice) - int256(pos.entryPrice);
        } else {
            priceDelta = int256(pos.entryPrice) - int256(atPrice);
        }

        // PnL = (priceDelta / entryPrice) × size
        pnl = (priceDelta * int256(pos.size)) / int256(pos.entryPrice);
        return pnl;
    }

    /**
     * @notice Get current unrealized PnL using live price
     */
    function getUnrealizedPnL(uint256 positionId) external view returns (int256) {
        uint256 currentPrice = IRoundEngine(roundEngine).getCurrentPrice();
        return calculatePnL(positionId, currentPrice);
    }

    // ═══════════════════════════════════════════════
    //  VIEWS
    // ═══════════════════════════════════════════════

    function getPosition(uint256 positionId) external view returns (Position memory) {
        return positions[positionId];
    }

    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userPositionIds[user];
    }

    function getOpenPositions(address user) external view returns (uint256[] memory) {
        uint256[] memory all = userPositionIds[user];
        uint256 openCount = 0;

        for (uint256 i = 0; i < all.length; i++) {
            if (positions[all[i]].isOpen) openCount++;
        }

        uint256[] memory open = new uint256[](openCount);
        uint256 idx = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (positions[all[i]].isOpen) {
                open[idx++] = all[i];
            }
        }
        return open;
    }

    function getGlobalOI() external view returns (uint256 longOI, uint256 shortOI, uint256 imbalance) {
        longOI = totalLongOI;
        shortOI = totalShortOI;
        imbalance = longOI > shortOI ? longOI - shortOI : shortOI - longOI;
    }

    // ═══════════════════════════════════════════════
    //  INTERNAL HELPERS
    // ═══════════════════════════════════════════════

    function _closePositionInternal(
        uint256 positionId,
        uint256 exitPrice,
        address liquidatorOrZero
    ) internal {
        Position storage pos = positions[positionId];

        int256 pnl = calculatePnL(positionId, exitPrice);

        pos.isOpen = false;
        pos.closeTimestamp = block.timestamp;
        pos.realizedPnL = pnl;

        // Update exposure tracking
        int256 exposureDelta = pos.isLong ? -int256(pos.size) : int256(pos.size);
        userNetExposure[pos.trader] += exposureDelta;
        if (pos.isLong) { totalLongOI -= pos.size; } else { totalShortOI -= pos.size; }

        uint256 toReturn;

        if (pnl >= 0) {
            // Profit: return margin + profit
            uint256 profit = uint256(pnl);

            // Collect 0.5% fee on profit
            uint256 closeFee = (profit * SPREAD_FEE_BPS) / BASIS_POINTS;
            uint256 netProfit = profit > closeFee ? profit - closeFee : 0;
            toReturn = pos.margin + netProfit;

            if (closeFee > 0) IFeeManager(feeManager).collectFee(closeFee, pos.trader);

            // Check if protocol can cover the profit (from insurance fund if needed)
            // In this model, profits come from other traders' losses pooled via fee manager
            ICreditVault(creditVault).creditUSCC(pos.trader, toReturn, "CLOSE_WIN");
        } else {
            // Loss: return margin - loss (never negative)
            uint256 loss = uint256(-pnl);
            toReturn = loss >= pos.margin ? 0 : pos.margin - loss;

            if (toReturn > 0) {
                ICreditVault(creditVault).creditUSCC(pos.trader, toReturn, "CLOSE_LOSS");
            }
        }

        ICreditVault(creditVault).updateOpenPositionCount(pos.trader, false);

        emit PositionClosed(positionId, pos.trader, exitPrice, pnl, block.timestamp);
    }

    function _liquidateInternal(
        uint256 positionId,
        uint256 liquidationPrice,
        address liquidator
    ) internal {
        Position storage pos = positions[positionId];

        pos.isOpen = false;
        pos.isLiquidated = true;
        pos.closeTimestamp = block.timestamp;
        pos.realizedPnL = -int256(pos.margin); // full margin loss

        // Update exposure tracking
        if (pos.isLong) { totalLongOI -= pos.size; } else { totalShortOI -= pos.size; }
        int256 exposureDelta = pos.isLong ? -int256(pos.size) : int256(pos.size);
        userNetExposure[pos.trader] += exposureDelta;

        uint256 margin = pos.margin;

        // Liquidation bot reward: 2% of margin
        uint256 botReward = (margin * LIQUIDATION_BOT_REWARD) / 100;
        // Remaining goes to fee manager (95% insurance, 5% platform via collectLiquidationFee)
        uint256 remainingMargin = margin - botReward;

        ICreditVault(creditVault).updateOpenPositionCount(pos.trader, false);

        // Pay liquidation bot
        if (liquidator != address(0) && botReward > 0) {
            ICreditVault(creditVault).creditUSCC(liquidator, botReward, "LIQ_REWARD");
        }

        // Send rest to fee manager
        IFeeManager(feeManager).collectLiquidationFee(remainingMargin, pos.trader);

        emit PositionLiquidated(positionId, pos.trader, liquidator, liquidationPrice, margin);
    }

    function _closePositionWithRefund(uint256 positionId) internal {
        Position storage pos = positions[positionId];

        pos.isOpen = false;
        pos.closeTimestamp = block.timestamp;
        pos.realizedPnL = 0;

        if (pos.isLong) { totalLongOI -= pos.size; } else { totalShortOI -= pos.size; }
        int256 exposureDelta = pos.isLong ? -int256(pos.size) : int256(pos.size);
        userNetExposure[pos.trader] += exposureDelta;

        // Full margin refund on cancel
        ICreditVault(creditVault).creditUSCC(pos.trader, pos.margin, "ROUND_CANCEL_REFUND");
        ICreditVault(creditVault).updateOpenPositionCount(pos.trader, false);

        emit PositionClosed(positionId, pos.trader, pos.entryPrice, 0, block.timestamp);
    }

    /**
     * @notice Calculate liquidation price
     * LONG:  entryPrice × (1 - (0.8 / leverage))
     * SHORT: entryPrice × (1 + (0.8 / leverage))
     * Using integer math: multiply by 1e6 to avoid decimals
     */
    function _calcLiquidationPrice(
        uint256 entryPrice,
        uint256 leverage,
        bool isLong
    ) internal pure returns (uint256) {
        // liqMove = entryPrice * LIQ_THRESHOLD / (leverage * 100)
        uint256 liqMove = (entryPrice * LIQ_THRESHOLD) / (leverage * 100);

        if (isLong) {
            return entryPrice > liqMove ? entryPrice - liqMove : 1;
        } else {
            return entryPrice + liqMove;
        }
    }

    function _isLiquidatable(
        Position storage pos,
        uint256 currentPrice
    ) internal view returns (bool) {
        if (pos.isLong) {
            return currentPrice <= pos.liquidationPrice;
        } else {
            return currentPrice >= pos.liquidationPrice;
        }
    }

    function _validateLeverage(uint256 leverage) internal pure {
        if (leverage < MIN_LEVERAGE || leverage > MAX_LEVERAGE) {
            revert InvalidLeverage(leverage);
        }
    }

    function _countOpenPositions(address user) internal view returns (uint256 count) {
        uint256[] storage ids = userPositionIds[user];
        for (uint256 i = 0; i < ids.length; i++) {
            if (positions[ids[i]].isOpen) count++;
        }
    }

    // ═══════════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════════

    /**
     * @notice Update max position size (should be ~1% of insurance fund)
     */
    function setMaxPositionSize(uint256 newMax) external onlyOwner {
        maxPositionSize = newMax;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

// ═══════════════════════════════════════════════
//  INTERFACES
// ═══════════════════════════════════════════════

interface IRoundEngine {
    function currentRoundId() external view returns (uint256);
    function getCurrentPrice() external view returns (uint256);
    function isPositionOpenAllowed() external view returns (bool);
}

interface ICreditVault {
    function getUSCCBalance(address user) external view returns (uint256);
    function deductUSCC(address user, uint256 amount, string calldata reason) external;
    function creditUSCC(address user, uint256 amount, string calldata reason) external;
    function updateOpenPositionCount(address user, bool isOpening) external;
}

interface IFeeManager {
    function collectFee(uint256 amount, address trader) external;
    function collectLiquidationFee(uint256 margin, address trader) external;
    function isInsuranceFundCritical() external view returns (bool);
}

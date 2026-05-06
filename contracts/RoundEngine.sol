// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RoundEngine
 * @notice Manages 60-second round cycles.
 *
 * Flow:
 *   1. Keeper calls startRound() → requests 1 VRF seed
 *   2. VRF fulfills seed → stored on-chain, emitted via RoundSeeded
 *   3. Keeper reads seed off-chain, pre-computes all 60 candles
 *   4. Keeper streams candles to frontend via WebSocket (off-chain)
 *   5. After 60s, keeper calls settleRound(finalPrice)
 *   6. Contract settles all positions, emits RoundSettled
 *   7. Loop back to step 1
 */
contract RoundEngine is Ownable, Pausable, ReentrancyGuard {

    // ═══════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════

    uint256 public constant ROUND_DURATION = 60 seconds;
    uint256 public constant POSITION_LOCK_WINDOW = 5 seconds;
    uint256 public constant STARTING_PRICE = 100_000; // 1.00000 with 5 decimals

    // ═══════════════════════════════════════════════
    //  STRUCTS
    // ═══════════════════════════════════════════════

    struct Round {
        uint256 roundId;
        uint256 startPrice;
        uint256 endPrice;
        uint256 startTime;
        uint256 endTime;
        uint256 seed;       // VRF seed for this round (keeper uses to compute candles)
        bool seedFulfilled; // true once VRF returns
        bool settled;
        bool cancelled;
    }

    // ═══════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════

    uint256 public currentRoundId;
    uint256 public currentPrice;
    bool public roundActive;

    mapping(uint256 => Round) public rounds;

    address public vrfConsumer;
    address public positionManager;
    mapping(address => bool) public authorizedKeepers;

    // ═══════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════

    event RoundStarted(uint256 indexed roundId, uint256 startPrice, uint256 startTime);
    event SeedFulfilled(uint256 indexed roundId, uint256 seed);
    event RoundSettled(uint256 indexed roundId, uint256 endPrice, uint256 endTime);
    event RoundCancelled(uint256 indexed roundId, string reason);

    // ═══════════════════════════════════════════════
    //  ERRORS
    // ═══════════════════════════════════════════════

    error RoundNotActive();
    error RoundAlreadyActive();
    error RoundNotReady();
    error SeedNotFulfilled();
    error NotAuthorizedKeeper();
    error NotVRFConsumer();
    error ZeroAddress();

    // ═══════════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════════

    modifier onlyKeeper() {
        if (!authorizedKeepers[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedKeeper();
        }
        _;
    }

    modifier onlyVRF() {
        if (msg.sender != vrfConsumer) revert NotVRFConsumer();
        _;
    }

    // ═══════════════════════════════════════════════
    //  CONSTRUCTOR
    // ═══════════════════════════════════════════════

    constructor(address _vrfConsumer) Ownable(msg.sender) {
        if (_vrfConsumer == address(0)) revert ZeroAddress();
        vrfConsumer = _vrfConsumer;
        currentPrice = STARTING_PRICE;
    }

    // ═══════════════════════════════════════════════
    //  ROUND LIFECYCLE
    // ═══════════════════════════════════════════════

    /**
     * @notice Start a new round — requests one VRF seed
     * @dev Keeper calls this. VRF seed comes back via fulfillSeed().
     *      Keeper then reads seed from SeedFulfilled event and computes
     *      all 60 candles off-chain.
     */
    function startRound() external onlyKeeper whenNotPaused nonReentrant {
        if (roundActive) revert RoundAlreadyActive();

        uint256 newRoundId = currentRoundId + 1;
        currentRoundId = newRoundId;
        roundActive = true;

        rounds[newRoundId] = Round({
            roundId: newRoundId,
            startPrice: currentPrice,
            endPrice: 0,
            startTime: block.timestamp,
            endTime: 0,
            seed: 0,
            seedFulfilled: false,
            settled: false,
            cancelled: false
        });

        emit RoundStarted(newRoundId, currentPrice, block.timestamp);

        // Request seed from VRF — fulfillSeed() called in same tx (sync)
        IVRFConsumer(vrfConsumer).requestSeed(newRoundId);
    }

    /**
     * @notice Called by VRFConsumer with the seed for this round
     * @dev Seed is emitted — keeper reads it and pre-computes candles off-chain
     */
    function fulfillSeed(uint256 roundId, uint256 seed) external onlyVRF {
        if (roundId != currentRoundId || !roundActive) return;

        Round storage round = rounds[roundId];
        round.seed = seed;
        round.seedFulfilled = true;

        emit SeedFulfilled(roundId, seed);
    }

    /**
     * @notice Settle the round at the final price computed by keeper
     * @param finalPrice The last candle close price (keeper computed from seed)
     * @dev Keeper calls this after 60 seconds with the pre-computed final price
     */
    function settleRound(uint256 finalPrice) external onlyKeeper nonReentrant {
        if (!roundActive) revert RoundNotActive();

        Round storage round = rounds[currentRoundId];

        // Must be at least 60 seconds in
        uint256 elapsed = block.timestamp - round.startTime;
        if (elapsed < ROUND_DURATION) revert RoundNotReady();

        // Seed must be fulfilled (should always be — VRF is sync in same tx as startRound)
        if (!round.seedFulfilled) revert SeedNotFulfilled();

        round.endPrice = finalPrice;
        round.endTime = block.timestamp;
        round.settled = true;
        roundActive = false;
        currentPrice = finalPrice; // carry price to next round

        emit RoundSettled(currentRoundId, finalPrice, block.timestamp);

        // Settle all open positions at final price
        if (positionManager != address(0)) {
            IPositionManager(positionManager).settleRound(currentRoundId, finalPrice);
        }
    }

    /**
     * @notice Emergency cancel — refunds all open positions
     */
    function cancelRound(string calldata reason) external onlyKeeper nonReentrant {
        if (!roundActive) revert RoundNotActive();

        Round storage round = rounds[currentRoundId];
        round.cancelled = true;
        round.endTime = block.timestamp;
        roundActive = false;

        emit RoundCancelled(currentRoundId, reason);

        if (positionManager != address(0)) {
            IPositionManager(positionManager).cancelRound(currentRoundId);
        }
    }

    // ═══════════════════════════════════════════════
    //  VIEWS
    // ═══════════════════════════════════════════════

    function getCurrentPrice() external view returns (uint256) {
        return currentPrice;
    }

    function getRound(uint256 roundId) external view returns (Round memory) {
        return rounds[roundId];
    }

    function getCurrentRound() external view returns (Round memory) {
        return rounds[currentRoundId];
    }

    function isPositionOpenAllowed() external view returns (bool) {
        if (!roundActive) return false;
        Round storage round = rounds[currentRoundId];
        uint256 elapsed = block.timestamp - round.startTime;
        return elapsed <= (ROUND_DURATION - POSITION_LOCK_WINDOW);
    }

    function getSecondsRemaining() external view returns (uint256) {
        if (!roundActive) return 0;
        Round storage round = rounds[currentRoundId];
        uint256 elapsed = block.timestamp - round.startTime;
        if (elapsed >= ROUND_DURATION) return 0;
        return ROUND_DURATION - elapsed;
    }

    function getSeed(uint256 roundId) external view returns (uint256) {
        return rounds[roundId].seed;
    }

    // ═══════════════════════════════════════════════
    //  ADMIN
    // ═══════════════════════════════════════════════

    function setPositionManager(address _positionManager) external onlyOwner {
        if (_positionManager == address(0)) revert ZeroAddress();
        positionManager = _positionManager;
    }

    function setAuthorizedKeeper(address keeper, bool status) external onlyOwner {
        if (keeper == address(0)) revert ZeroAddress();
        authorizedKeepers[keeper] = status;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function emergencyCancelRound() external onlyOwner {
        if (!roundActive) revert RoundNotActive();
        Round storage round = rounds[currentRoundId];
        round.cancelled = true;
        round.endTime = block.timestamp;
        roundActive = false;
        emit RoundCancelled(currentRoundId, "Emergency cancel by owner");
        if (positionManager != address(0)) {
            IPositionManager(positionManager).cancelRound(currentRoundId);
        }
    }
}

// ═══════════════════════════════════════════════
//  INTERFACES
// ═══════════════════════════════════════════════

interface IVRFConsumer {
    function requestSeed(uint256 roundId) external returns (uint256);
}

interface IPositionManager {
    function settleRound(uint256 roundId, uint256 finalPrice) external;
    function cancelRound(uint256 roundId) external;
    function onPriceUpdate(uint256 roundId, uint256 newPrice) external;
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VRFConsumer
 * @notice Generate one random seed per round using block.prevrandao.
 *         Keeper reads the seed from RoundSeeded event, pre-computes
 *         all 60 candles off-chain, streams to frontend, settles at end.
 */
contract VRFConsumer is Ownable {

    address public roundEngine;
    uint256 public requestCounter;

    event RoundSeeded(uint256 indexed roundId, uint256 seed);

    error NotRoundEngine();
    error ZeroAddress();

    modifier onlyRoundEngine() {
        if (msg.sender != roundEngine) revert NotRoundEngine();
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Called by RoundEngine.startRound() — generate one seed for the round
     * @param roundId The round to seed
     * @return seed The random seed (0 - 2^256-1)
     */
    function requestSeed(uint256 roundId) external onlyRoundEngine returns (uint256 seed) {
        requestCounter++;

        seed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            block.number,
            roundId,
            requestCounter,
            msg.sender
        )));

        emit RoundSeeded(roundId, seed);

        // Pass seed directly to RoundEngine
        IRoundEngine(roundEngine).fulfillSeed(roundId, seed);

        return seed;
    }

    function setRoundEngine(address _roundEngine) external onlyOwner {
        if (_roundEngine == address(0)) revert ZeroAddress();
        roundEngine = _roundEngine;
    }
}

interface IRoundEngine {
    function fulfillSeed(uint256 roundId, uint256 seed) external;
}

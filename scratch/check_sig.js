const { keccak256, toHex, stringToBytes } = require('viem')

const errors = [
    "PositionNotFound(uint256)",
    "NotPositionOwner(uint256)",
    "PositionNotOpen(uint256)",
    "PositionAlreadyLiquidated(uint256)",
    "InvalidLeverage(uint256)",
    "RoundNotActive()",
    "InLockWindow()",
    "InsufficientMargin(uint256,uint256)",
    "ExceedsNetExposureLimit(int256,uint256)",
    "ExceedsOIImbalanceLimit()",
    "ExceedsMaxPositionSize(uint256,uint256)",
    "ExceedsMaxPositions(uint256,uint256)",
    "NotLiquidatable(uint256)",
    "OnlyRoundEngine()",
    "ZeroAddress()",
    "ZeroAmount()"
]

errors.forEach(e => {
    const hash = keccak256(Buffer.from(e))
    console.log(`${e}: ${hash.slice(0, 10)}`)
})

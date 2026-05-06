from eth_utils import keccak, to_hex

errors = [
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

for e in errors:
    sig = to_hex(keccak(text=e))[:10]
    print(f"{e}: {sig}")

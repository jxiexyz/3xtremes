from eth_utils import keccak, to_bytes

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
    sig = keccak(to_bytes(text=e))[:4].hex()
    print(f"{sig}: {e}")

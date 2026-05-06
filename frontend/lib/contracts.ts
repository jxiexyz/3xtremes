export const CONTRACTS = {
  FEE_MANAGER:      '0xDe406769737e9d18B0EADCA2A6172f619EC60813',
  CREDIT_VAULT:     '0xcd123112f212593998BeCD4Db0fAdeba076609A0',
  VRF_CONSUMER:     '0x1c837BB156B03191916E798b69b713864664B2c5',
  ROUND_ENGINE:     '0x89a33E9EE8A4D0D7e1117866df3F37e8E90251cF',
  POSITION_MANAGER: '0x8E9C46A81c62A1Caf816803Bb1911DAa69Ec9d0C',
  USDC:             '0x3600000000000000000000000000000000000000',
} as const

export const CREDIT_VAULT_ABI = [
  { name: 'deposit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'usdcAmount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'usccAmount', type: 'uint256' }], outputs: [] },
  { name: 'getUSCCBalance', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

export const POSITION_MANAGER_ABI = [
  { name: 'openPosition',   type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'isLong', type: 'bool' }, { name: 'margin', type: 'uint256' }, { name: 'leverage', type: 'uint256' }],
    outputs: [{ name: 'positionId', type: 'uint256' }] },
  { name: 'closePosition',  type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [] },
  { name: 'getUserPositions', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256[]' }] },
  { name: 'getPosition', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'positionId', type: 'uint256' }],
    outputs: [{ type: 'tuple', components: [
      { name: 'positionId',      type: 'uint256' },
      { name: 'trader',          type: 'address'  },
      { name: 'roundId',         type: 'uint256' },
      { name: 'isLong',          type: 'bool'    },
      { name: 'entryPrice',      type: 'uint256' },
      { name: 'margin',          type: 'uint256' },
      { name: 'leverage',        type: 'uint256' },
      { name: 'size',            type: 'uint256' },
      { name: 'liquidationPrice',type: 'uint256' },
      { name: 'isOpen',          type: 'bool'    },
      { name: 'isLiquidated',    type: 'bool'    },
      { name: 'openTimestamp',   type: 'uint256' },
      { name: 'closeTimestamp',  type: 'uint256' },
      { name: 'realizedPnL',     type: 'int256'  },
    ]}] },
  { name: 'getUnrealizedPnL', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'positionId', type: 'uint256' }], outputs: [{ type: 'int256' }] },
] as const


export const ROUND_ENGINE_ABI = [
  { name: 'getCurrentPrice', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'currentRoundId', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'roundActive', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
] as const

export const ERC20_ABI = [
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

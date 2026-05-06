import { createPublicClient, http } from 'viem'
import { defineChain } from 'viem'

const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
})

const POSITION_MANAGER_ABI = [
  { name: 'MIN_LEVERAGE', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'MAX_LEVERAGE', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'maxPositionSize', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
]

const PM_ADDR = "0x5DEe12abA6C58c94272891ffc35d88dB43579B7a"

async function check() {
  const client = createPublicClient({ chain: arcTestnet, transport: http() })
  try {
    const min = await client.readContract({ address: PM_ADDR, abi: POSITION_MANAGER_ABI, functionName: 'MIN_LEVERAGE' })
    const max = await client.readContract({ address: PM_ADDR, abi: POSITION_MANAGER_ABI, functionName: 'MAX_LEVERAGE' })
    const size = await client.readContract({ address: PM_ADDR, abi: POSITION_MANAGER_ABI, functionName: 'maxPositionSize' })
    console.log(`MIN: ${min}, MAX: ${max}, MAX_SIZE: ${size}`)
  } catch (e) {
    console.error(e)
  }
}

check()

import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;

  const pendingNonce = await provider.getTransactionCount(deployer.address, "pending");
  const confirmedNonce = await provider.getTransactionCount(deployer.address, "latest");

  console.log(`Confirmed nonce: ${confirmedNonce}`);
  console.log(`Pending nonce:   ${pendingNonce}`);

  if (pendingNonce === confirmedNonce) {
    console.log("✅ No stuck transactions.");
    return;
  }

  // Cancel each stuck tx by sending 0 ETH to self with higher gas price
  for (let n = confirmedNonce; n < pendingNonce; n++) {
    console.log(`🔄 Cancelling stuck tx at nonce ${n}...`);
    const tx = await deployer.sendTransaction({
      to: deployer.address,
      value: 0n,
      nonce: n,
      gasPrice: ethers.parseUnits("10", "gwei"), // much higher gas price to replace
    });
    console.log(`  Sent cancel tx: ${tx.hash}`);
    await tx.wait();
    console.log(`  ✓ Nonce ${n} cleared`);
  }

  console.log("\n✅ All stuck txs cleared! Retry setPermissions now.");
}

main().catch((err) => { console.error("❌ Failed:", err); process.exit(1); });

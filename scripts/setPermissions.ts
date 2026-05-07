import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [deployer] = await ethers.getSigners();
  const PM   = process.env.POSITION_MANAGER_ADDRESS!;
  const CV   = process.env.CREDIT_VAULT_ADDRESS!;
  const FM   = process.env.FEE_MANAGER_ADDRESS!;

  console.log("🔐 Setting permissions for PositionManager:", PM);

  // CreditVault
  const cv = await ethers.getContractAt("CreditVault", CV);
  console.log("⏳ CreditVault.setAuthorizedContract...");
  const tx1 = await cv.setAuthorizedContract(PM, true);
  await tx1.wait();
  console.log("  ✓ CreditVault authorizes PositionManager");

  await delay(3000); // biar nonce clear

  // FeeManager
  const fm = await ethers.getContractAt("FeeManager", FM);
  console.log("⏳ FeeManager.setAuthorizedCaller...");
  const tx2 = await fm.setAuthorizedCaller(PM, true);
  await tx2.wait();
  console.log("  ✓ FeeManager authorizes PositionManager");

  console.log("\n✅ All permissions set! Bot siap jalan.");
}

main().catch((err) => { console.error("❌ Failed:", err); process.exit(1); });

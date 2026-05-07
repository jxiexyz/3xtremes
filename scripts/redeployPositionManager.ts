import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const ROUND_ENGINE = process.env.ROUND_ENGINE_ADDRESS!;
  const CREDIT_VAULT = process.env.CREDIT_VAULT_ADDRESS!;
  const FEE_MANAGER  = process.env.FEE_MANAGER_ADDRESS!;

  if (!ROUND_ENGINE || !CREDIT_VAULT || !FEE_MANAGER) {
    throw new Error("❌ Missing ROUND_ENGINE_ADDRESS / CREDIT_VAULT_ADDRESS / FEE_MANAGER_ADDRESS in .env");
  }

  console.log("📦 Deploying new PositionManager (Hybrid DEX)...");
  const PM = await ethers.getContractFactory("PositionManager");
  const pm = await PM.deploy(CREDIT_VAULT, FEE_MANAGER, ROUND_ENGINE);
  await pm.waitForDeployment();
  const addr = await pm.getAddress();
  console.log("✅ New PositionManager:", addr);

  // ── Set Permissions ──────────────────────────────────────────────────────
  console.log("\n🔐 Setting permissions...");

  const re = await ethers.getContractAt("RoundEngine", ROUND_ENGINE);
  await re.setPositionManager(addr);
  console.log("  ✓ RoundEngine → PositionManager");

  const cv = await ethers.getContractAt("CreditVault", CREDIT_VAULT);
  await cv.setAuthorizedContract(addr, true);
  console.log("  ✓ CreditVault authorizes PositionManager");

  const fm = await ethers.getContractAt("FeeManager", FEE_MANAGER);
  await fm.setAuthorizedCaller(addr, true);
  console.log("  ✓ FeeManager authorizes PositionManager");

  // ── Auto-update .env ─────────────────────────────────────────────────────
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf8");
  envContent = envContent.replace(
    /POSITION_MANAGER_ADDRESS=.*/,
    `POSITION_MANAGER_ADDRESS=${addr}`
  );
  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ .env updated: POSITION_MANAGER_ADDRESS=" + addr);
  console.log("\n🎉 Redeploy complete! Restart keeper bot to pick up new address.");
}

main().catch((err) => { console.error("❌ Deploy failed:", err); process.exit(1); });

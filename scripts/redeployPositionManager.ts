import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const ROUND_ENGINE = "0x85fF2dd16DF3059A4A909E561d90146b11B55bf4";
  const CREDIT_VAULT = process.env.CREDIT_VAULT_ADDRESS!;
  const FEE_MANAGER = process.env.FEE_MANAGER_ADDRESS!;

  const PM = await ethers.getContractFactory("PositionManager");
  const pm = await PM.deploy(CREDIT_VAULT, FEE_MANAGER, ROUND_ENGINE);
  await pm.waitForDeployment();
  const addr = await pm.getAddress();
  console.log("✅ New PositionManager:", addr);

  // Set permissions
  const re = await ethers.getContractAt("RoundEngine", ROUND_ENGINE);
  await re.setPositionManager(addr);
  console.log("✓ RoundEngine → PositionManager");

  const cv = await ethers.getContractAt("CreditVault", CREDIT_VAULT);
  await cv.setAuthorizedContract(addr, true);
  console.log("✓ CreditVault authorizes PositionManager");

  const fm = await ethers.getContractAt("FeeManager", FEE_MANAGER);
  await fm.setAuthorizedCaller(addr, true);
  console.log("✓ FeeManager authorizes PositionManager");

  console.log("\nUpdate .env: POSITION_MANAGER_ADDRESS=" + addr);
}

main().catch(console.error);

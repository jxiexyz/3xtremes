import { ethers } from "hardhat";

async function main() {
  const ENGINE_ADDR = "0x59691AF3eC1249Ae826866e13F129304Bad5a6d9";
  const BOT_ADDR = "0x22A88bF5c6C0A224627B76073B69FA0b98b73C9E";

  console.log("🔐 Authorizing Railway Bot as Keeper...");
  const engine = await ethers.getContractAt("RoundEngine", ENGINE_ADDR);
  const tx = await engine.setAuthorizedKeeper(BOT_ADDR, true, { gasPrice: ethers.parseUnits("100", "gwei") });
  await tx.wait();
  
  console.log("✅ Success! Bot is now an authorized Keeper.");
}

main().catch(console.error);

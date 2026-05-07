import { ethers } from "hardhat";

async function main() {
  const PM_ADDR = "0xaf71EB8a82c782724154e21A08a45CB1bfE2e73c";
  const NEW_MAX = ethers.parseUnits("100000000", 6); // 100 Million USDC

  console.log("📏 Updating Max Position Size to 100M USDC...");
  const pm = await ethers.getContractAt("PositionManager", PM_ADDR);
  const tx = await pm.setMaxPositionSize(NEW_MAX, { gasPrice: ethers.parseUnits("100", "gwei") });
  await tx.wait();
  
  const currentMax = await pm.maxPositionSize();
  console.log(`✅ Success! Current Max: ${ethers.formatUnits(currentMax, 6)} USDC`);
}

main().catch(console.error);

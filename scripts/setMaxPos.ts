import { ethers } from "hardhat";

async function main() {
  const PM_ADDRESS = "0x478c4978b7d205702E02BD299f89d5D4D4c8C69A";
  const pm = await ethers.getContractAt("PositionManager", PM_ADDRESS);
  
  console.log("📏 Current Max Position Size checking...");
  // 1,000,000,000,000 = 1,000,000 USCC (6 decimals)
  const tx = await pm.setMaxPositionSize(BigInt("1000000000000"), {
    gasPrice: ethers.parseUnits("50", "gwei")
  });
  await tx.wait();
  
  console.log("✅ Max Position Size updated to 1,000,000 USCC!");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

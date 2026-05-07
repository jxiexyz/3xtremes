import { ethers } from "hardhat";

async function main() {
  const VRF_ADDR = "0x1c837BB156B03191916E798b69b713864664B2c5";
  const ENGINE_ADDR = "0x59691AF3eC1249Ae826866e13F129304Bad5a6d9";
  const PM_ADDR = "0xaf71EB8a82c782724154e21A08a45CB1bfE2e73c";
  const VAULT_ADDR = "0xcd123112f212593998BeCD4Db0fAdeba076609A0";
  const FEE_ADDR = "0xDe406769737e9d18B0EADCA2A6172f619EC60813";

  const gasPrice = ethers.parseUnits("100", "gwei");

  console.log("🔗 Linking VRFConsumer...");
  const vrf = await ethers.getContractAt("VRFConsumer", VRF_ADDR);
  await (await vrf.setRoundEngine(ENGINE_ADDR, { gasPrice })).wait();
  console.log("✅ VRF linked");

  console.log("🔗 Linking CreditVault...");
  const vault = await ethers.getContractAt("CreditVault", VAULT_ADDR);
  await (await vault.setAuthorizedContract(PM_ADDR, true, { gasPrice })).wait();
  console.log("✅ Vault linked");

  console.log("🔗 Linking FeeManager...");
  const fee = await ethers.getContractAt("FeeManager", FEE_ADDR);
  await (await fee.setAuthorizedCaller(PM_ADDR, true, { gasPrice })).wait();
  console.log("✅ FeeManager linked");

  console.log("\n🚀 All links restored!");
}

main().catch(console.error);

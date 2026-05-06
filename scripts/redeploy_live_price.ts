import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Redeploying for LIVE PRICE sync...");
  console.log("Deployer:", deployer.address);

  // Reuse existing addresses from .env or previous deploy if possible
  // But for safety, we'll need VRF, CreditVault, and FeeManager addresses
  const VRF_CONSUMER = "0x1c837BB156B03191916E798b69b713864664B2c5"; // Dari logs Anda sebelumnya
  const CREDIT_VAULT = "0xcd123112f212593998BeCD4Db0fAdeba076609A0";
  const FEE_MANAGER  = "0xDe406769737e9d18B0EADCA2A6172f619EC60813";

  // 1. Deploy New RoundEngine
  console.log("\n📦 Deploying Upgraded RoundEngine...");
  const RoundEngine = await ethers.getContractFactory("RoundEngine");
  const roundEngine = await RoundEngine.deploy(VRF_CONSUMER, { gasPrice: ethers.parseUnits("100", "gwei") });
  await roundEngine.waitForDeployment();
  const engineAddr = await roundEngine.getAddress();
  console.log("✅ New RoundEngine:", engineAddr);

  // 2. Deploy New PositionManager
  console.log("\n📦 Deploying Upgraded PositionManager...");
  const PositionManager = await ethers.getContractFactory("PositionManager");
  const positionManager = await PositionManager.deploy(
    CREDIT_VAULT,
    FEE_MANAGER,
    engineAddr,
    { gasPrice: ethers.parseUnits("100", "gwei") }
  );
  await positionManager.waitForDeployment();
  const pmAddr = await positionManager.getAddress();
  console.log("✅ New PositionManager:", pmAddr);

  // 3. Set Permissions
  console.log("\n🔐 Linking contracts...");
  
  // RoundEngine -> PositionManager
  await (await roundEngine.setPositionManager(pmAddr, { gasPrice: ethers.parseUnits("100", "gwei") })).wait();
  console.log("  ✓ Engine linked to PM");

  // RoundEngine keeper: deployer (agar bot keeper bisa updatePrice)
  await (await roundEngine.setAuthorizedKeeper(deployer.address, true, { gasPrice: ethers.parseUnits("100", "gwei") })).wait();
  console.log("  ✓ Keeper authorized");

  // CreditVault needs to authorize NEW PositionManager
  const CreditVault = await ethers.getContractAt("CreditVault", CREDIT_VAULT);
  await (await CreditVault.setAuthorizedContract(pmAddr, true, { gasPrice: ethers.parseUnits("100", "gwei") })).wait();
  console.log("  ✓ CreditVault authorized new PM");

  // FeeManager needs to authorize NEW PositionManager
  const FeeManager = await ethers.getContractAt("FeeManager", FEE_MANAGER);
  await (await FeeManager.setAuthorizedCaller(pmAddr, true, { gasPrice: ethers.parseUnits("100", "gwei") })).wait();
  console.log("  ✓ FeeManager authorized new PM");

  // VRFConsumer needs to point to NEW RoundEngine
  const VRFConsumer = await ethers.getContractAt("VRFConsumer", VRF_CONSUMER);
  await (await VRFConsumer.setRoundEngine(engineAddr, { gasPrice: ethers.parseUnits("100", "gwei") })).wait();
  console.log("  ✓ VRFConsumer linked to new Engine");

  console.log("\n🎉 REDEPLOY COMPLETE!");
  console.log("=".repeat(50));
  console.log("COPY THESE TO YOUR .env (BOT & FRONTEND):");
  console.log(`ROUND_ENGINE_ADDRESS=${engineAddr}`);
  console.log(`POSITION_MANAGER_ADDRESS=${pmAddr}`);
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

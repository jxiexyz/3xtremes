import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying 3xtremes contracts...");
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ── STEP 1: FeeManager ───────────────────────────────────────────────────
  console.log("📦 1/5 Deploying FeeManager...");
  const FeeManager = await ethers.getContractFactory("FeeManager");
  const feeManager = await FeeManager.deploy(deployer.address); // platform wallet = deployer for now
  await feeManager.waitForDeployment();
  console.log("✅ FeeManager:", await feeManager.getAddress());

  // ── STEP 2: CreditVault ──────────────────────────────────────────────────
  const USDC_ADDRESS = process.env.USDC_ADDRESS!;
  if (!USDC_ADDRESS) throw new Error("USDC_ADDRESS not set in .env");

  console.log("\n📦 2/5 Deploying CreditVault...");
  const CreditVault = await ethers.getContractFactory("CreditVault");
  const creditVault = await CreditVault.deploy(USDC_ADDRESS);
  await creditVault.waitForDeployment();
  console.log("✅ CreditVault:", await creditVault.getAddress());

  // ── STEP 3: VRFConsumer ──────────────────────────────────────────────────

  console.log("\n📦 3/5 Deploying VRFConsumer...");
  const VRFConsumer = await ethers.getContractFactory("VRFConsumer");
  const vrfConsumer = await VRFConsumer.deploy();
  await vrfConsumer.waitForDeployment();
  console.log("✅ VRFConsumer:", await vrfConsumer.getAddress());

  // ── STEP 4: RoundEngine ──────────────────────────────────────────────────
  console.log("\n📦 4/5 Deploying RoundEngine...");
  const RoundEngine = await ethers.getContractFactory("RoundEngine");
  const roundEngine = await RoundEngine.deploy(await vrfConsumer.getAddress());
  await roundEngine.waitForDeployment();
  console.log("✅ RoundEngine:", await roundEngine.getAddress());

  // ── STEP 5: PositionManager ──────────────────────────────────────────────
  console.log("\n📦 5/5 Deploying PositionManager...");
  const PositionManager = await ethers.getContractFactory("PositionManager");
  const positionManager = await PositionManager.deploy(
    await creditVault.getAddress(),
    await feeManager.getAddress(),
    await roundEngine.getAddress()
  );
  await positionManager.waitForDeployment();
  console.log("✅ PositionManager:", await positionManager.getAddress());

  // ── STEP 6: Set Permissions ──────────────────────────────────────────────
  console.log("\n🔐 Setting permissions...");

  // VRFConsumer knows RoundEngine
  await vrfConsumer.setRoundEngine(await roundEngine.getAddress());
  console.log("  ✓ VRFConsumer → RoundEngine set");

  // RoundEngine knows PositionManager
  await roundEngine.setPositionManager(await positionManager.getAddress());
  console.log("  ✓ RoundEngine → PositionManager set");

  // CreditVault authorizes PositionManager
  await creditVault.setAuthorizedContract(await positionManager.getAddress(), true);
  console.log("  ✓ CreditVault authorizes PositionManager");

  // FeeManager authorizes PositionManager
  await feeManager.setAuthorizedCaller(await positionManager.getAddress(), true);
  console.log("  ✓ FeeManager authorizes PositionManager");

  // RoundEngine authorizes deployer as keeper (replace with Gelato Automation address)
  await roundEngine.setAuthorizedKeeper(deployer.address, true);
  console.log("  ✓ RoundEngine keeper: deployer (replace with Gelato Automation address)");

  // ── DONE ─────────────────────────────────────────────────────────────────
  console.log("\n🎉 Deployment complete!\n");
  console.log("=".repeat(50));
  console.log("CONTRACT ADDRESSES — save these in your .env:");
  console.log("=".repeat(50));
  console.log(`FEE_MANAGER_ADDRESS=${await feeManager.getAddress()}`);
  console.log(`CREDIT_VAULT_ADDRESS=${await creditVault.getAddress()}`);
  console.log(`VRF_CONSUMER_ADDRESS=${await vrfConsumer.getAddress()}`);
  console.log(`ROUND_ENGINE_ADDRESS=${await roundEngine.getAddress()}`);
  console.log(`POSITION_MANAGER_ADDRESS=${await positionManager.getAddress()}`);
  console.log("=".repeat(50));
  console.log("\n⚠️  Next steps:");
  console.log("  1. Register VRFConsumer with Gelato VRF dashboard");
  console.log("  2. Create Gelato Automation task for startRound/settleRound");
  console.log("  3. Create Gelato Automation task for requestPriceMove (every second)");
  console.log("  4. Set Gelato Automation address as authorized keeper in RoundEngine");
  console.log("  5. Update GELATO_KEEPER_ADDRESS in .env and run setKeeper.ts");
  console.log("  6. Fund insurance fund via FeeManager (initial seed recommended)");
  console.log("  7. Call startRound() to begin!\n");
}

main().catch((err) => {
  console.error("❌ Deploy failed:", err);
  process.exit(1);
});

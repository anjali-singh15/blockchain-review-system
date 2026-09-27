const hre = require("hardhat");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error("Missing SEPOLIA_RPC_URL in .env");
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying ReviewRegistry with account: ${deployer.address}`);

  const ReviewRegistry = await hre.ethers.getContractFactory("ReviewRegistry");
  const reviewRegistry = await ReviewRegistry.deploy();

  await reviewRegistry.waitForDeployment();

  const deployedAddress = await reviewRegistry.getAddress();
  console.log(`ReviewRegistry deployed to: ${deployedAddress}`);
  console.log(`Update your frontend .env with: VITE_CONTRACT_ADDRESS=${deployedAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

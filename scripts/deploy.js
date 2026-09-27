const hre = require("hardhat");
require("dotenv").config();

async function main() {
  if (!process.env.SEPOLIA_RPC_URL) {
    throw new Error("Missing SEPOLIA_RPC_URL in .env");
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY in .env");
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying YourContract with account: ${deployer.address}`);

  const YourContract = await hre.ethers.getContractFactory("YourContract");
  const yourContract = await YourContract.deploy();

  await yourContract.waitForDeployment();

  const deployedAddress = await yourContract.getAddress();
  console.log(`YourContract deployed to: ${deployedAddress}`);
  console.log(`Update your frontend env with: VITE_CONTRACT_ADDRESS=${deployedAddress}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

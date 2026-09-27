require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
const path = require("path");

const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;
const hasUsablePrivateKey =
  typeof PRIVATE_KEY === "string" && /^([a-fA-F0-9]{64}|0x[a-fA-F0-9]{64})$/.test(PRIVATE_KEY);

module.exports = {
  solidity: "0.8.24",
  paths: {
    sources: path.join(__dirname, "contracts", "contracts"),
    tests: path.join(__dirname, "contracts", "test"),
    cache: path.join(__dirname, "contracts", "cache"),
    artifacts: path.join(__dirname, "contracts", "artifacts"),
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL || "",
      accounts: hasUsablePrivateKey ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`] : [],
    },
  },
};

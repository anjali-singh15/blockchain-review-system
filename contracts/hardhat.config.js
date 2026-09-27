require("@nomicfoundation/hardhat-toolbox");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;
const hasUsablePrivateKey =
  typeof PRIVATE_KEY === "string" && /^([a-fA-F0-9]{64}|0x[a-fA-F0-9]{64})$/.test(PRIVATE_KEY);

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL || "",
      accounts: hasUsablePrivateKey ? [PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`] : [],
    },
  },
};

import { ethers } from "ethers";
import { env } from "../config/env.js";

const reviewRegistryAbi = [
  "function storeReview(string calldata _review) external",
  "function getReview() external view returns (string)",
  "function storeReviewHash(string calldata reviewHash) external",
  "function verifyReviewHash(string calldata reviewHash) external view returns (bool)",
  "event ReviewHashStored(string indexed reviewHash, address indexed reviewer, uint256 timestamp)",
];

let contract;

export const isBlockchainConfigured = () => Boolean(env.rpcUrl && env.privateKey && env.contractAddress);

const getContract = () => {
  if (contract) {
    return contract;
  }

  if (!isBlockchainConfigured()) {
    throw new Error("Blockchain environment variables are not configured correctly");
  }

  const provider = new ethers.JsonRpcProvider(env.rpcUrl);
  const wallet = new ethers.Wallet(env.privateKey, provider);
  contract = new ethers.Contract(env.contractAddress, reviewRegistryAbi, wallet);
  return contract;
};

export const storeReviewHashOnChain = async (reviewHash) => {
  const contract = getContract();
  const transaction = await contract.storeReviewHash(reviewHash);
  const receipt = await transaction.wait();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    minedAt: new Date(),
    status: receipt.status,
  };
};

export const verifyReviewHashOnChain = async (reviewHash) => {
  const contract = getContract();

  try {
    const isValid = await contract.verifyReviewHash(reviewHash);
    return Boolean(isValid);
  } catch (error) {
    const storedReview = await contract.getReview();
    return storedReview === reviewHash;
  }
};

import { ethers } from "ethers";
import contractData from "../abi/YourContract.json";

const REVIEW_REGISTRY_ABI = [
  "function storeReviewHash(string reviewHash) external",
  "function verifyReviewHash(string reviewHash) external view returns (bool)",
  "event ReviewHashStored(string indexed reviewHash, address indexed reviewer, uint256 timestamp)",
];
const YOUR_CONTRACT_ABI = contractData;

const SEPOLIA_CONFIG = {
  chainIdHex: "0xaa36a7",
  chainIdDecimal: 11155111,
  chainName: "Sepolia",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "SEP",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.sepolia.org"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

const getExpectedNetwork = () => {
  const envChainId = import.meta.env.VITE_CHAIN_ID;
  const decimalChainId = envChainId ? Number(envChainId) : SEPOLIA_CONFIG.chainIdDecimal;
  const chainIdHex = `0x${decimalChainId.toString(16)}`;

  return {
    chainIdHex: envChainId ? chainIdHex : SEPOLIA_CONFIG.chainIdHex,
    chainIdDecimal: decimalChainId,
    chainName: import.meta.env.VITE_CHAIN_NAME || SEPOLIA_CONFIG.chainName,
    nativeCurrency: SEPOLIA_CONFIG.nativeCurrency,
    rpcUrls: [import.meta.env.VITE_CHAIN_RPC_URL || SEPOLIA_CONFIG.rpcUrls[0]],
    blockExplorerUrls: [import.meta.env.VITE_BLOCK_EXPLORER_BASE || SEPOLIA_CONFIG.blockExplorerUrls[0]],
  };
};

const getExplorerBaseUrl = () => {
  const network = getExpectedNetwork();
  return `${network.blockExplorerUrls[0].replace(/\/$/, "")}/tx/`;
};

const getContractAddress = (fallbackAddress = "") => {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || fallbackAddress;

  if (!contractAddress) {
    throw new Error(
      "Missing contract address. Add VITE_CONTRACT_ADDRESS to client/.env or return contractAddress from the backend.",
    );
  }

  console.log("Loaded VITE_CONTRACT_ADDRESS:", contractAddress);
  return contractAddress;
};

const getEthereumProvider = () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask and try again.");
  }

  return window.ethereum;
};

const normalizeChainIdHex = (chainId) => {
  if (typeof chainId === "string" && chainId.startsWith("0x")) {
    return chainId.toLowerCase();
  }

  return `0x${Number(chainId).toString(16)}`.toLowerCase();
};

const getFriendlyWalletError = (error) => {
  if (error?.code === 4001) {
    return "Transaction was rejected in MetaMask.";
  }

  if (error?.code === -32002) {
    return "MetaMask already has a pending wallet request. Open MetaMask and continue.";
  }

  if (error?.code === 4902) {
    return "Sepolia is not available in MetaMask. Add the network and try again.";
  }

  if (error?.message?.toLowerCase().includes("insufficient funds")) {
    return "The connected wallet does not have enough Sepolia ETH to pay gas.";
  }

  if (error?.code === "CALL_EXCEPTION") {
    return "Smart contract call failed. Check that the Sepolia contract address, ABI, and function name are correct.";
  }

  return error?.message || "MetaMask transaction failed.";
};

const getConnectedAccounts = async (ethereum) => {
  const accounts = await ethereum.request({ method: "eth_accounts" });
  console.log("MetaMask authorized accounts:", accounts);
  return accounts;
};

const ensureCorrectNetwork = async (ethereum) => {
  const expectedNetwork = getExpectedNetwork();
  const currentChainId = await ethereum.request({ method: "eth_chainId" });
  const normalizedCurrentChainId = normalizeChainIdHex(currentChainId);
  const normalizedExpectedChainId = normalizeChainIdHex(expectedNetwork.chainIdHex);

  console.log("MetaMask current chainId:", currentChainId);
  console.log("MetaMask current chainId (decimal):", parseInt(normalizedCurrentChainId, 16));
  console.log("Expected chainId:", normalizedExpectedChainId);
  console.log("Expected chainId (decimal):", expectedNetwork.chainIdDecimal);

  if (normalizedCurrentChainId === normalizedExpectedChainId) {
    return normalizedCurrentChainId;
  }

  console.log(`Attempting to switch MetaMask to ${expectedNetwork.chainName}...`);

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: normalizedExpectedChainId }],
    });
  } catch (switchError) {
    console.error("wallet_switchEthereumChain failed:", switchError);

    if (switchError?.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: normalizedExpectedChainId,
            chainName: expectedNetwork.chainName,
            nativeCurrency: expectedNetwork.nativeCurrency,
            rpcUrls: expectedNetwork.rpcUrls,
            blockExplorerUrls: expectedNetwork.blockExplorerUrls,
          },
        ],
      });
    } else {
      throw switchError;
    }
  }

  const chainIdAfterSwitch = await ethereum.request({ method: "eth_chainId" });
  const normalizedAfterSwitch = normalizeChainIdHex(chainIdAfterSwitch);
  console.log("MetaMask chainId after switch attempt:", chainIdAfterSwitch);

  if (normalizedAfterSwitch !== normalizedExpectedChainId) {
    throw new Error(
      `Wrong network selected in MetaMask. Switch to ${expectedNetwork.chainName} (chain ID ${expectedNetwork.chainIdDecimal}) and try again.`,
    );
  }

  return normalizedAfterSwitch;
};

export const getConnectedWalletAccount = async () => {
  const ethereum = getEthereumProvider();
  const accounts = await getConnectedAccounts(ethereum);
  return accounts?.[0] || "";
};

export const connectWallet = async () => {
  try {
    const ethereum = getEthereumProvider();
    const selectedChainId = await ensureCorrectNetwork(ethereum);

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    console.log("MetaMask connection request accounts:", accounts);

    if (!accounts?.length) {
      throw new Error("No MetaMask account is connected.");
    }

    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();
    console.log("Connected MetaMask account:", account);

    return {
      account,
      chainId: parseInt(selectedChainId, 16),
      provider,
      signer,
    };
  } catch (error) {
    console.error("MetaMask connection error:", error);
    throw new Error(getFriendlyWalletError(error));
  }
};

const getWritableContractContext = async (contractAddress, abi) => {
  const ethereum = getEthereumProvider();

  const selectedChainId = await ensureCorrectNetwork(ethereum);
  console.log("Validated MetaMask chainId:", selectedChainId);
  console.log("Validated MetaMask chainId (decimal):", parseInt(selectedChainId, 16));

  const accounts = await getConnectedAccounts(ethereum);

  if (!accounts?.length) {
    throw new Error("MetaMask wallet is not connected. Click Connect Wallet first.");
  }

  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const account = await signer.getAddress();
  console.log("Selected MetaMask account:", account);

  const balance = await provider.getBalance(account);
  console.log("Selected account balance:", ethers.formatEther(balance), "ETH");

  if (balance <= 0n) {
    throw new Error("The connected wallet has no Sepolia ETH for gas fees.");
  }

  const resolvedContractAddress = getContractAddress(contractAddress);
  console.log("Loaded contract address:", resolvedContractAddress);
  console.log("Using contract address:", resolvedContractAddress);
  console.log("Loaded ABI entries:", abi.length);

  if (!ethers.isAddress(resolvedContractAddress)) {
    throw new Error("Invalid contract address. Check that the deployed Sepolia contract address is correct.");
  }

  const contractCode = await provider.getCode(resolvedContractAddress);
  console.log("Contract code present on selected network:", contractCode !== "0x");

  if (contractCode === "0x") {
    throw new Error(
      "No smart contract found at this address on Sepolia. Deploy the contract to Sepolia and update VITE_CONTRACT_ADDRESS or the backend contractAddress.",
    );
  }

  const contract = new ethers.Contract(resolvedContractAddress, abi, signer);
  return { account, contract, selectedChainId, resolvedContractAddress, signer };
};

export const storeReviewHashWithMetaMask = async (reviewHash, contractAddress) => {
  try {
    const { account, contract, selectedChainId, resolvedContractAddress, signer } =
      await getWritableContractContext(
      contractAddress,
      REVIEW_REGISTRY_ABI,
      );

    const normalizedReviewHash = String(reviewHash || "").trim();

    if (!normalizedReviewHash) {
      throw new Error("Review hash is missing. Submit the review again and retry the blockchain step.");
    }

    console.log("Calling contract function to store review hash");
    console.log("Review hash:", normalizedReviewHash);

    let transaction;

    try {
      transaction = await contract.storeReviewHash(normalizedReviewHash);
    } catch (contractError) {
      console.error("Blockchain error:", {
        code: contractError?.code,
        reason: contractError?.reason,
        shortMessage: contractError?.shortMessage,
        data: contractError?.data,
        address: resolvedContractAddress,
        chainId: selectedChainId,
      });

      const shouldFallbackToSetValue =
        contractError?.code === "CALL_EXCEPTION" ||
        contractError?.shortMessage?.toLowerCase().includes("missing revert data");

      if (!shouldFallbackToSetValue) {
        throw contractError;
      }

      console.log(
        "storeReviewHash is not available on the deployed contract. Falling back to setValue(reviewHash) for YourContract.",
      );

      const fallbackContract = new ethers.Contract(resolvedContractAddress, YOUR_CONTRACT_ABI, signer);
      transaction = await fallbackContract.setValue(normalizedReviewHash, {
        gasLimit: 150000n,
      });
    }

    console.log("MetaMask transaction submitted:", transaction.hash);

    const receipt = await transaction.wait();
    console.log("MetaMask transaction confirmed:", {
      hash: receipt.hash,
      status: receipt.status,
      blockNumber: receipt.blockNumber,
    });

    return {
      account,
      transactionHash: transaction.hash,
      explorerUrl: `${getExplorerBaseUrl()}${transaction.hash}`,
      receipt,
    };
  } catch (error) {
    console.error("MetaMask blockchain error:", error);
    throw new Error(getFriendlyWalletError(error));
  }
};

export const setValueWithMetaMask = async (value, contractAddress) => {
  try {
    const { account, contract, selectedChainId, resolvedContractAddress } =
      await getWritableContractContext(
      contractAddress,
      YOUR_CONTRACT_ABI,
      );

    if (typeof value === "undefined" || value === null) {
      throw new Error("Value is required before calling setValue.");
    }

    const normalizedValue =
      typeof value === "string" ? value : typeof value === "object" ? JSON.stringify(value) : String(value);

    console.log("Calling contract function: setValue(string newValue)");
    console.log("Writing to contract address:", resolvedContractAddress);
    console.log("Value:", normalizedValue);
    console.log("Type:", typeof normalizedValue);

    let transaction;

    try {
      transaction = await contract.setValue(String(normalizedValue), {
        gasLimit: 150000n,
      });
    } catch (contractError) {
      console.error("setValue contract call failed:", {
        code: contractError?.code,
        reason: contractError?.reason,
        shortMessage: contractError?.shortMessage,
        data: contractError?.data,
        value: normalizedValue,
        valueType: typeof normalizedValue,
        address: resolvedContractAddress,
        chainId: selectedChainId,
      });
      throw contractError;
    }

    console.log("MetaMask transaction submitted:", transaction.hash);

    const receipt = await transaction.wait();
    console.log("MetaMask transaction confirmed:", {
      hash: receipt.hash,
      status: receipt.status,
      blockNumber: receipt.blockNumber,
    });

    return {
      account,
      transactionHash: transaction.hash,
      explorerUrl: `${getExplorerBaseUrl()}${transaction.hash}`,
      receipt,
      chainId: parseInt(selectedChainId, 16),
    };
  } catch (error) {
    console.error("MetaMask blockchain error:", error);
    throw new Error(getFriendlyWalletError(error));
  }
};

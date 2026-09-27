import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { createReview, saveReviewBlockchainReceipt } from "../api/reviewApi";
import {
  connectWallet,
  getConnectedWalletAccount,
  storeReviewHashWithMetaMask,
} from "../services/walletService";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

const initialState = {
  productName: "",
  reviewText: "",
  rating: 5,
  orderId: "",
};

const SubmitReviewPage = () => {
  const [formData, setFormData] = useState(initialState);
  const [isVerified, setIsVerified] = useState(false);
  const [submissionState, setSubmissionState] = useState({
    status: "Pending",
    result: null,
    error: "",
    message: "",
    txHash: "",
  });
  const [loading, setLoading] = useState(false);
  const [walletAccount, setWalletAccount] = useState("");
  const [walletConnecting, setWalletConnecting] = useState(false);
  const { updateUser } = useAuth();
  const { pushNotification } = useNotification();

  useEffect(() => {
    const loadWalletConnection = async () => {
      try {
        const connectedAccount = await getConnectedWalletAccount();
        if (connectedAccount) {
          setWalletAccount(connectedAccount);
        }
      } catch (error) {
        console.error("Unable to read MetaMask connection status:", error);
      }
    };

    loadWalletConnection();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: name === "rating" ? Number(value) : value }));
  };

  const handleConnectWallet = async () => {
    setWalletConnecting(true);

    try {
      const connection = await connectWallet();
      setWalletAccount(connection.account);
      pushNotification({
        type: "success",
        title: "Wallet connected",
        message: `Connected ${connection.account}`,
      });
    } catch (error) {
      pushNotification({
        type: "error",
        title: "Wallet connection failed",
        message: error.message,
      });
    } finally {
      setWalletConnecting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isVerified) {
      return;
    }

    if (!walletAccount) {
      setSubmissionState({
        status: "Pending",
        result: null,
        error: "Connect MetaMask before submitting a review to the blockchain.",
        message: "",
        txHash: "",
      });
      pushNotification({
        type: "error",
        title: "Wallet not connected",
        message: "Click Connect Wallet and approve MetaMask before submitting.",
      });
      return;
    }

    setLoading(true);
    setSubmissionState({ status: "Pending", result: null, error: "", message: "", txHash: "" });

    try {
      const response = await createReview(formData);
      let finalMessage = response.message || "";
      let finalTxHash = "";
      const classification = response.data.label || "";
      const isGenuine = classification === "GENUINE";

      console.log("Classification:", classification);

      if (isGenuine) {
        try {
          const blockchainResult = await storeReviewHashWithMetaMask(
            response.data.reviewHash,
            response.data.contractAddress,
          );
          finalTxHash = blockchainResult.transactionHash;
          await saveReviewBlockchainReceipt(response.data.id, { txHash: blockchainResult.transactionHash });
          finalMessage = `${response.message || "Review submitted successfully."} Blockchain transaction confirmed.`;
          console.log("Etherscan URL:", blockchainResult.explorerUrl);
        } catch (blockchainError) {
          finalMessage = `${response.message || "Review submitted successfully."} Blockchain storage is still pending.`;
          console.error("Detailed blockchain submission error:", blockchainError);
          pushNotification({
            type: "error",
            title: "Blockchain transaction failed",
            message: blockchainError.message,
          });
        }
      } else {
        finalMessage = "Fake review detected. Please try again.";
        console.log("Skipping blockchain storage because the review is not genuine.");
        pushNotification({
          type: "error",
          title: "Blockchain storage skipped",
          message: "Fake review not stored on blockchain",
        });
        setFormData(initialState);
        setIsVerified(false);
      }

      if (isGenuine) {
        setIsVerified(true);
      }

      setSubmissionState({
        status: isGenuine ? "Verified" : "Rejected",
        result: response.data,
        error:
          isGenuine && !finalTxHash
            ? "Blockchain storage is still pending. Check MetaMask and console logs for the exact reason."
            : "",
        message: finalMessage,
        txHash: finalTxHash || response.txHash || response.data.blockchainTxHash || "",
      });
      pushNotification({
        type: isGenuine ? "success" : "error",
        title: isGenuine ? "Review submitted" : "Fake review detected",
        message: finalMessage,
      });
      updateUser({ trustScore: response.data.userTrustScore });
      if (!isGenuine) {
        return;
      }
    } catch (error) {
      setSubmissionState({
        status: "Failed",
        result: null,
        error: error.response?.data?.message || "Submission failed",
        message: "",
        txHash: "",
      });
      pushNotification({
        type: "error",
        title: "Submission failed",
        message: error.response?.data?.message || "Review could not be submitted.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <PageHeader
        eyebrow="Submit"
        title="Register a product review"
        description="Only buyers already approved in MongoDB with a matching email and order ID can submit reviews for a product."
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="glass-panel rounded-[2rem] p-6 shadow-soft">
          <div className="grid gap-5">
            <div className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">MetaMask Wallet</p>
                  <p className="mt-1 break-all text-sm text-slate-600 dark:text-slate-300">
                    {walletAccount ? `Connected: ${walletAccount}` : "Not connected"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={walletConnecting}
                  className="rounded-full bg-teal-400 px-5 py-2 font-semibold text-black transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {walletConnecting ? "Connecting..." : walletAccount ? "Reconnect Wallet" : "Connect Wallet"}
                </button>
              </div>
            </div>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Product Name</span>
              <input
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                disabled={isVerified}
                required
                className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Review Text</span>
              <textarea
                name="reviewText"
                value={formData.reviewText}
                onChange={handleChange}
                disabled={isVerified}
                required
                rows="6"
                className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70"
              />
            </label>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Rating</span>
                <input
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={handleChange}
                  disabled={isVerified}
                  required
                  className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Order ID</span>
                <input
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
                disabled={isVerified}
                required
                className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70"
              />
              </label>
            </div>
            <button
              type="submit"
              disabled={loading || !walletAccount || isVerified}
              className="rounded-full bg-blue-300 px-5 py-3 font-semibold text-black transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Submitting..."
                : isVerified
                  ? "Review Verified"
                  : walletAccount
                    ? "Analyze and Store Review"
                    : "Connect Wallet to Submit"}
            </button>
          </div>
        </form>

        <aside className="glass-panel rounded-[2rem] p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-teal-400">Submission Status</p>
          <div className="mt-4">
            <StatusBadge value={submissionState.status} />
          </div>

          {submissionState.result ? (
            <div className="mt-6 grid gap-4 text-sm text-slate-700 dark:text-slate-300">
              {submissionState.message ? (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Result</p>
                  <p>{submissionState.message}</p>
                </div>
              ) : null}
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">Trust Score</p>
                <p>{submissionState.result.trustScore}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">User Trust Score</p>
                <p>{submissionState.result.userTrustScore ?? "Updating..."}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">Classification</p>
                <StatusBadge value={submissionState.result.label} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">Verification Status</p>
                <StatusBadge value={submissionState.result.verified ? "Verified" : "Rejected"} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-50">Why it was scored this way</p>
                <ul className="mt-2 list-disc space-y-2 pl-5">
                  {submissionState.result.reasons?.length ? (
                    submissionState.result.reasons.map((reason) => <li key={reason}>{reason}</li>)
                  ) : (
                    <li>No suspicious activity detected.</li>
                  )}
                </ul>
              </div>
              {submissionState.txHash ? (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">Blockchain Transaction</p>
                  <p className="break-all font-mono text-xs text-slate-900 dark:text-slate-200">{submissionState.txHash}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
              Use an order ID that already exists in the approved reviewer records stored in MongoDB Atlas.
            </p>
          )}

          {submissionState.error ? (
            <p className="mt-6 text-sm font-medium text-black dark:text-red-400">{submissionState.error}</p>
          ) : null}
        </aside>
      </div>
    </section>
  );
};

export default SubmitReviewPage;

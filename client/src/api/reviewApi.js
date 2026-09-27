import axios from "axios";
import { API_BASE_URL } from "../config/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

const sanitizeToken = (token) => `${token || ""}`.trim().replace(/^"+|"+$/g, "");

api.interceptors.request.use(
  (config) => {
    const token = sanitizeToken(localStorage.getItem("token"));
    console.log("Token:", token || "missing");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Authorization header set:", `Bearer ${token.slice(0, 12)}...`);
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
      console.log("Authorization header removed because token is missing.");
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "";

    if (status === 401) {
      console.error("Authentication error response:", message || "Unauthorized");

      if (
        message === "Authentication token expired" ||
        message === "Invalid authentication token" ||
        message === "Authentication failed"
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("reviewtrust-auth");
        delete api.defaults.headers.common.Authorization;
        console.log("Cleared stored auth because the token is invalid or expired.");
      }
    }

    return Promise.reject(error);
  },
);

export const createReview = async (payload) => {
  const { data } = await api.post("/reviews", payload);
  return data;
};

export const saveReviewBlockchainReceipt = async (reviewId, payload) => {
  const { data } = await api.patch(`/reviews/${reviewId}/blockchain`, payload);
  return data;
};

export const getReviews = async (params = {}) => {
  const { data } = await api.get("/reviews", { params });
  return data;
};

export const getPublicReviews = async () => {
  const { data } = await api.get("/reviews/public");
  return data;
};

export const getDatasetSummary = async () => {
  const { data } = await api.get("/dataset");
  return data;
};

export default api;

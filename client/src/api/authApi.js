import api from "./reviewApi";

export const registerUser = async (payload) => {
  console.log("Frontend register request:", payload);
  const { data } = await api.post("/auth/register", payload);
  console.log("Frontend register response:", data);
  return data;
};

export const loginUser = async (payload) => {
  console.log("Frontend login request:", payload);
  const { data } = await api.post("/auth/login", payload);
  console.log("Frontend login response:", data);
  return data;
};

export const forgotPassword = async (payload) => {
  const { data } = await api.post("/auth/forgot-password", payload);
  return data;
};

export const verifyOtp = async (payload) => {
  const { data } = await api.post("/auth/verify-otp", payload);
  return data;
};

export const resetPassword = async (payload) => {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
};

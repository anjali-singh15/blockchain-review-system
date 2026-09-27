import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/reviewApi";
import { loginUser, registerUser } from "../api/authApi";

const AuthContext = createContext(null);
const storageKey = "reviewtrust-auth";
const tokenStorageKey = "token";
const adminEmail = "yname5139@gmail.com";
const sanitizeToken = (token) => `${token || ""}`.trim().replace(/^"+|"+$/g, "");

const extractAuthPayload = (state) => {
  if (state?.data) {
    return state.data;
  }

  return state || {};
};

const normalizeAuthState = (state) => {
  const payload = extractAuthPayload(state);

  return {
    token: sanitizeToken(payload?.token),
    user: payload?.user
    ? {
        ...payload.user,
        trustScore: typeof payload.user.trustScore === "number" ? payload.user.trustScore : 75,
        isAdmin: Boolean(payload.user.isAdmin ?? payload.user.email === adminEmail),
      }
    : null,
  };
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const fallbackToken = sanitizeToken(localStorage.getItem(tokenStorageKey));
      const normalizedStoredState = stored ? normalizeAuthState(JSON.parse(stored)) : { token: "", user: null };

      return normalizedStoredState.token || !fallbackToken
        ? normalizedStoredState
        : { token: fallbackToken, user: normalizedStoredState.user };
    } catch (error) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(tokenStorageKey);
      return { token: "", user: null };
    }
  });

  useEffect(() => {
    const sanitizedToken = sanitizeToken(authState.token);

    if (sanitizedToken) {
      api.defaults.headers.common.Authorization = `Bearer ${sanitizedToken}`;
      localStorage.setItem(tokenStorageKey, sanitizedToken);
      localStorage.setItem(storageKey, JSON.stringify({ ...authState, token: sanitizedToken }));
      console.log("Stored authentication token:", `${sanitizedToken.slice(0, 12)}...`);
    } else {
      delete api.defaults.headers.common.Authorization;
      localStorage.removeItem(tokenStorageKey);
      localStorage.removeItem(storageKey);
      console.log("Removed authentication token from localStorage.");
    }
  }, [authState]);

  const login = async (payload) => {
    const response = await loginUser(payload);
    const normalizedResponse = normalizeAuthState(response);

    if (!normalizedResponse.token) {
      throw new Error("Authentication token missing from login response");
    }

    console.log("Login token received:", `${normalizedResponse.token.slice(0, 12)}...`);
    setAuthState(normalizedResponse);
    return response;
  };

  const register = async (payload) => {
    const response = await registerUser(payload);
    const normalizedResponse = normalizeAuthState(response);

    if (!normalizedResponse.token) {
      throw new Error("Authentication token missing from registration response");
    }

    console.log("Registration token received:", `${normalizedResponse.token.slice(0, 12)}...`);
    setAuthState(normalizedResponse);
    return response;
  };

  const logout = () => setAuthState({ token: "", user: null });
  const updateUser = (nextUser) =>
    setAuthState((current) =>
      normalizeAuthState({
        ...current,
        user: current.user ? { ...current.user, ...nextUser } : nextUser,
      }),
    );

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated: Boolean(authState.token),
      isAdmin: Boolean(authState.user?.isAdmin),
      login,
      register,
      logout,
      updateUser,
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

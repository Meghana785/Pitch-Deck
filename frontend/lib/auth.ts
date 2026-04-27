"use client";

import Cookies from "js-cookie";

const TOKEN_KEY = "pitchready_token";
const USER_KEY = "pitchready_user";

export interface AuthUser {
  id: string;
  email: string;
  plan: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

/**
 * Save token and user info to cookies/localStorage
 */
export const setSession = (token: string, user: AuthUser) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7 }); // 7 days
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Remove session data
 */
export const clearSession = () => {
  Cookies.remove(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Get current token (Async for compatibility)
 */
export async function getToken(): Promise<string | null> {
  return Cookies.get(TOKEN_KEY) ?? null;
}

/**
 * Get current user
 */
export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Get current authenticated session (Async for compatibility)
 */
export async function getSession(): Promise<AuthSession | null> {
  const token = await getToken();
  const user = getUser();
  if (!token || !user) return null;
  return { user, token };
}

/**
 * Signs out the current user and redirects
 */
export async function signOut(): Promise<void> {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/**
 * Helper for authenticated fetch
 */
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = await getToken();
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
  
  return res;
};

/**
 * Subscribe to auth changes (Stub for compatibility)
 */
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void
): () => void {
  // Execute immediately with current state
  getSession().then(callback);
  return () => {};
}

/**
 * VaultAuth SSO — Unified API Service Adapter
 * Interacts with FastAPI live backend running at api.vaultauth.proplays2312.eu.org
 */
import { CONFIG } from "../config";

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  // Token & Session Storage Management (Ephemeral sessionStorage - zero disk persistence)
  getToken() {
    return sessionStorage.getItem("vaultauth_token");
  }

  setSession(data) {
    if (data.token) sessionStorage.setItem("vaultauth_token", data.token);
    if (data.email) sessionStorage.setItem("vaultauth_email", data.email);
    if (data.role) sessionStorage.setItem("vaultauth_role", data.role);
    if (data.user_id) sessionStorage.setItem("vaultauth_user_id", data.user_id);
  }

  clearSession() {
    sessionStorage.removeItem("vaultauth_token");
    sessionStorage.removeItem("vaultauth_email");
    sessionStorage.removeItem("vaultauth_role");
    sessionStorage.removeItem("vaultauth_user_id");
  }

  getUser() {
    const token = this.getToken();
    if (!token) return null;
    return {
      token,
      email: sessionStorage.getItem("vaultauth_email") || "user@vaultauth.internal",
      role: sessionStorage.getItem("vaultauth_role") || "user",
      userId: sessionStorage.getItem("vaultauth_user_id") || "",
    };
  }

  /**
   * Health Ping with Latency Measurement
   */
  async checkHealth() {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // Try /health, then fallback to /api/v1/health
      let res = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${this.baseUrl}/api/v1/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - startTime);

      if (!res.ok) {
        return { ok: false, status: `HTTP ${res.status}`, latency };
      }

      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        status: data.status || "healthy",
        latency,
        database: data.database || "connected",
      };
    } catch (err) {
      const latency = Math.round(performance.now() - startTime);
      return {
        ok: false,
        status: "offline",
        latency,
        error: err.name === "AbortError" ? "Timeout (>6s)" : err.message,
      };
    }
  }

  /**
   * Standardized JSON fetch wrapper with error envelope extraction
   */
  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    };

    const token = this.getToken();
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await res.json().catch(() => ({})) : {};

    if (!res.ok) {
      // 401 Unauthorized - Invalidate token if expired/revoked
      if (res.status === 401 && endpoint !== "/api/v1/auth/login") {
        this.clearSession();
        window.dispatchEvent(new CustomEvent("vaultauth:unauthorized"));
      }

      const errorMessage =
        data.error?.message ||
        data.detail ||
        data.message ||
        `Request failed with status ${res.status}`;
      const errorCode = data.error?.code || `HTTP_${res.status}`;

      const error = new Error(errorMessage);
      error.code = errorCode;
      error.status = res.status;
      error.requestId = data.error?.request_id;
      throw error;
    }

    return data;
  }

  // --- Auth APIs ---

  async register(email, password) {
    return this.request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyEmail(email, code) {
    return this.request("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  }

  async resendVerificationCode(email) {
    return this.request("/api/v1/auth/verify-email/resend", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async login(email, password) {
    return this.request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async verify2FA(email, code, challengeId) {
    const payload = { email, code };
    if (challengeId) payload.challenge_id = challengeId;
    return this.request("/api/v1/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async logout() {
    try {
      if (this.getToken()) {
        await this.request("/api/v1/auth/logout", { method: "POST" });
      }
    } finally {
      this.clearSession();
    }
  }

  // --- Profile & Sessions APIs ---

  async getProfile() {
    return this.request("/api/v1/me", { method: "GET" });
  }

  async getSessions() {
    return this.request("/api/v1/me/sessions", { method: "GET" });
  }

  async revokeSession(sessionId) {
    return this.request(`/api/v1/sessions/${sessionId}`, { method: "DELETE" });
  }
}

export const api = new ApiService(CONFIG.API_BASE_URL);

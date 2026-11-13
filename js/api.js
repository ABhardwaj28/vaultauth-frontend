/**
 * VaultAuth SSO — API Service Layer
 * Foundation module for communicating with the VaultAuth backend.
 */
import { CONFIG } from "./config.js";

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /**
   * Health check to test backend reachability and readiness.
   * @returns {Promise<{ ok: boolean, status: string }>}
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });
      if (!response.ok) {
        return { ok: false, status: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return { ok: true, status: data.status || "healthy" };
    } catch (err) {
      console.warn("Backend health check failed:", err);
      return { ok: false, status: "offline", error: err.message };
    }
  }

  /**
   * User Registration (Starting stage implementation)
   */
  async register(email, password) {
    const res = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error?.message || data.detail || "Registration failed");
    }
    return data;
  }

  /**
   * User Primary Login (Starting stage implementation)
   */
  async login(email, password) {
    const res = await fetch(`${this.baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error?.message || data.detail || "Invalid credentials");
    }
    return data;
  }
}

export const api = new ApiService(CONFIG.API_BASE_URL);

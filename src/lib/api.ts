/**
 * VaultAuth SSO — Enterprise API Client Adapter
 * Strict X-Request-ID injection, X-RateLimit-* parsing, and normalized ApiError envelope
 */
import {
  ApiError,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  TwoFactorVerifyPayload,
  TwoFactorVerifyResponse,
  UserProfile,
  SessionItem,
  OAuthClient,
  CreateOAuthClientPayload,
  AdminUsersFilter,
  AdminUsersResponse,
  AdminUserListItem,
  AuditLogItem,
  GenericMessageResponse,
  HealthCheckResponse,
} from "@/types/api";

const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.vaultauth.proplays2312.eu.org";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  // Ephemeral storage helpers
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("vaultauth_token");
  }

  setToken(token: string): void {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vaultauth_token", token);
    }
  }

  clearToken(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vaultauth_token");
      sessionStorage.removeItem("vaultauth_user");
    }
  }

  /**
   * Typed request dispatcher
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; headers: Headers; rateLimit?: { limit?: number; remaining?: number; reset?: number } }> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestId = crypto.randomUUID();

    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Accept", "application/json");
    headers.set("X-Request-ID", requestId);

    const token = this.getToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: unknown) {
      const netErr: ApiError = {
        status: 0,
        code: "ERR_NETWORK",
        message: err instanceof Error ? err.message : "Network offline or service unreachable.",
        requestId,
        timestamp: new Date().toISOString(),
      };
      throw netErr;
    }

    // Rate Limit Header Extraction
    const limitHeader = response.headers.get("X-RateLimit-Limit");
    const remainingHeader = response.headers.get("X-RateLimit-Remaining");
    const resetHeader = response.headers.get("X-RateLimit-Reset");
    const rateLimit = {
      limit: limitHeader ? parseInt(limitHeader, 10) : undefined,
      remaining: remainingHeader ? parseInt(remainingHeader, 10) : undefined,
      reset: resetHeader ? parseInt(resetHeader, 10) : undefined,
    };

    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const responseBody = isJson ? await response.json().catch(() => ({})) : {};

    if (!response.ok) {
      const responseRequestId =
        response.headers.get("X-Request-ID") || responseBody?.error?.request_id || requestId;

      // Handle 401 Unauthorized globally
      if (response.status === 401 && endpoint !== "/api/v1/auth/login") {
        this.clearToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("vaultauth:session_expired", {
              detail: { message: responseBody?.error?.message || "Session expired." },
            })
          );
        }
      }

      const errorPayload: ApiError = {
        status: response.status,
        code:
          responseBody?.error?.code ||
          (response.status === 401
            ? "ERR_UNAUTHENTICATED"
            : response.status === 403
            ? "ERR_FORBIDDEN"
            : response.status === 404
            ? "ERR_NOT_FOUND"
            : response.status === 429
            ? "ERR_RATE_LIMITED"
            : `HTTP_${response.status}`),
        message:
          responseBody?.error?.message ||
          responseBody?.detail ||
          responseBody?.message ||
          `Request failed with status ${response.status}`,
        requestId: responseRequestId,
        rateLimitReset: rateLimit.reset,
        timestamp: new Date().toISOString(),
      };

      throw errorPayload;
    }

    return {
      data: responseBody as T,
      headers: response.headers,
      rateLimit,
    };
  }

  // --- Health Handshake ---
  async checkHealth(): Promise<{ ok: boolean; status: string; latency: number; details?: HealthCheckResponse }> {
    const startTime = performance.now();
    try {
      let res = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
      }).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`${this.baseUrl}/api/v1/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
      }

      const latency = Math.round(performance.now() - startTime);
      if (!res.ok) {
        return { ok: false, status: `HTTP ${res.status}`, latency };
      }
      const data = await res.json().catch(() => ({ status: "ok" }));
      return { ok: true, status: data.status || "healthy", latency, details: data };
    } catch {
      const latency = Math.round(performance.now() - startTime);
      return { ok: false, status: "offline", latency };
    }
  }

  // --- Authentication ---
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async verify2FA(payload: TwoFactorVerifyPayload): Promise<TwoFactorVerifyResponse> {
    const res = await this.request<TwoFactorVerifyResponse>("/api/v1/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async register(payload: RegisterPayload): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async verifyEmail(email: string, code: string): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>("/api/v1/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    return res.data;
  }

  async resendVerifyEmail(email: string): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>("/api/v1/auth/verify-email/resend", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return res.data;
  }

  async logout(): Promise<void> {
    try {
      if (this.getToken()) {
        await this.request<GenericMessageResponse>("/api/v1/auth/logout", {
          method: "POST",
        });
      }
    } finally {
      this.clearToken();
    }
  }

  // --- Profile & User Sessions ---
  async getMe(): Promise<UserProfile> {
    const res = await this.request<UserProfile>("/api/v1/me", { method: "GET" });
    return res.data;
  }

  async getMySessions(): Promise<SessionItem[]> {
    const res = await this.request<SessionItem[] | { sessions: SessionItem[] }>("/api/v1/me/sessions", {
      method: "GET",
    });
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray((res.data as { sessions: SessionItem[] })?.sessions)) {
      return (res.data as { sessions: SessionItem[] }).sessions;
    }
    return [];
  }

  async revokeSession(sessionId: string): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>(`/api/v1/sessions/${sessionId}`, {
      method: "DELETE",
    });
    return res.data;
  }

  // --- Administrator Endpoints ---
  async getOAuthClients(): Promise<OAuthClient[]> {
    const res = await this.request<OAuthClient[] | { clients: OAuthClient[] }>(
      "/api/v1/admin/oauth/clients",
      { method: "GET" }
    );
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray((res.data as { clients: OAuthClient[] })?.clients)) {
      return (res.data as { clients: OAuthClient[] }).clients;
    }
    return [];
  }

  async createOAuthClient(payload: CreateOAuthClientPayload): Promise<OAuthClient> {
    const res = await this.request<OAuthClient>("/api/v1/admin/oauth/clients", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  async revokeOAuthClient(clientId: string): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>(
      `/api/v1/admin/oauth/clients/${clientId}`,
      { method: "DELETE" }
    );
    return res.data;
  }

  async getAdminUsers(filter?: AdminUsersFilter): Promise<AdminUsersResponse> {
    const params = new URLSearchParams();
    if (filter?.q) params.set("q", filter.q);
    if (filter?.role && filter.role !== "All") params.set("role", filter.role);
    if (filter?.status && filter.status !== "All") params.set("status", filter.status);
    if (filter?.limit) params.set("limit", filter.limit.toString());
    if (filter?.offset) params.set("offset", filter.offset.toString());

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<AdminUsersResponse | AdminUserListItem[]>(
      `/api/v1/admin/users${queryString}`,
      { method: "GET" }
    );

    if (Array.isArray(res.data)) {
      return {
        items: res.data,
        total: res.data.length,
        limit: filter?.limit || 20,
        offset: filter?.offset || 0,
      };
    }
    return res.data;
  }

  async unlockUser(userId: string): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>(
      `/api/v1/admin/users/${userId}/unlock`,
      { method: "POST" }
    );
    return res.data;
  }

  async updateUserStatus(userId: string, status: "ACTIVE" | "DISABLED"): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>(
      `/api/v1/admin/users/${userId}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status }),
      }
    );
    return res.data;
  }

  async updateUserRole(userId: string, role: "user" | "admin"): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>(
      `/api/v1/admin/users/${userId}/role`,
      {
        method: "POST",
        body: JSON.stringify({ role }),
      }
    );
    return res.data;
  }

  async getAuditLogs(params?: { event?: string; limit?: number }): Promise<AuditLogItem[]> {
    const query = new URLSearchParams();
    if (params?.event && params.event !== "All") query.set("event", params.event);
    if (params?.limit) query.set("limit", params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request<AuditLogItem[] | { logs: AuditLogItem[] }>(
      `/api/v1/admin/audit-logs${queryString}`,
      { method: "GET" }
    );

    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray((res.data as { logs: AuditLogItem[] })?.logs)) {
      return (res.data as { logs: AuditLogItem[] }).logs;
    }
    return [];
  }

  async getGlobalSessions(limit = 50): Promise<SessionItem[]> {
    const res = await this.request<SessionItem[] | { sessions: SessionItem[] }>(
      `/api/v1/admin/sessions?limit=${limit}`,
      { method: "GET" }
    );
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray((res.data as { sessions: SessionItem[] })?.sessions)) {
      return (res.data as { sessions: SessionItem[] }).sessions;
    }
    return [];
  }
}

export const api = new ApiClient(DEFAULT_BASE_URL);

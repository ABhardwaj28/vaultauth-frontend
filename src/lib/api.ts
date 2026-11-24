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
  AdminSessionItem,
  OAuthClient,
  CreateOAuthClientPayload,
  AdminUsersFilter,
  AdminUsersResponse,
  AdminUserListItem,
  AuditLogItem,
  GenericMessageResponse,
  HealthCheckResponse,
  ChangePasswordResponse,
  AuthActionResponse,
  User2FAResponse,
  AdminEnforce2FAResponse,
  AdminActionResponse,
} from "@/types/api";

const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.vaultauth.proplays2312.eu.org";

/**
 * Unauthenticated auth flows. A 401 from one of these endpoints is a normal
 * credential/code failure — it must not clear a valid session or emit a
 * `vaultauth:session_expired` event.
 */
const PUBLIC_AUTH_ENDPOINTS = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
  "/api/v1/auth/register",
  "/api/v1/auth/2fa/resend",
  "/api/v1/auth/2fa/verify",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/verify-reset-code",
  "/api/v1/auth/reset-password",
]);

/** Descriptive, non-network error for endpoints absent from the internal spec. */
function endpointUnavailable(method: string, reason: string): ApiError {
  return {
    status: 501,
    code: "ERR_ENDPOINT_UNAVAILABLE",
    message: `${reason} (api.${method} is not defined by the internal OpenAPI specification).`,
    timestamp: new Date().toISOString(),
  };
}

export interface RequestOptions extends RequestInit {
  skipAuthExpiredEvent?: boolean;
  timeoutMs?: number;
}

class ApiClient {
  public baseUrl: string;
  private userDirectoryCache: { users: AdminUserListItem[]; total: number; timestamp: number } | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  invalidateUserCache(): void {
    this.userDirectoryCache = null;
  }

  /**
   * The internal API reports 2FA via `two_factor_required` / `challenge_id`.
   * Older UI code still reads `state` / `requires_2fa`, so derive those aliases
   * from the authoritative fields rather than inventing new state.
   */
  private normalizeLoginResponse(data: LoginResponse): LoginResponse {
    const requires2FA =
      data.two_factor_required === true ||
      Boolean(data.challenge_id) ||
      data.requires_2fa === true;
    return {
      ...data,
      requires_2fa: data.requires_2fa ?? requires2FA,
      state: data.state ?? (requires2FA ? "OTP_REQUIRED" : "AUTHENTICATED"),
    };
  }

  // Ephemeral storage helpers
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("vaultauth_token") || localStorage.getItem("vaultauth_token");
  }

  setToken(token: string): void {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vaultauth_token", token);
      localStorage.setItem("vaultauth_token", token);
    }
  }

  clearToken(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("vaultauth_token");
      sessionStorage.removeItem("vaultauth_user");
      localStorage.removeItem("vaultauth_token");
    }
  }

  /**
   * Typed request dispatcher with strict timeout and lifecycle guards
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
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

    const timeoutMs = options.timeoutMs ?? 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const netErr: ApiError = {
        status: 0,
        code: isAbort ? "ERR_TIMEOUT" : "ERR_NETWORK",
        message: isAbort
          ? "Request timed out after waiting for server response."
          : err instanceof Error
          ? err.message
          : "Network offline or service unreachable.",
        requestId,
        timestamp: new Date().toISOString(),
      };
      throw netErr;
    } finally {
      clearTimeout(timer);
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

    // Handle 204 No Content gracefully
    if (response.status === 204) {
      return {
        data: {} as T,
        headers: response.headers,
        rateLimit,
      };
    }

    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const responseBody = isJson ? await response.json().catch(() => ({})) : {};

    if (!response.ok) {
      const responseRequestId =
        response.headers.get("X-Request-ID") || responseBody?.error?.request_id || requestId;

      // Handle 401 Unauthorized globally, except for public auth endpoints and
      // explicit hydration bypasses. A bad reset code / login must never log a
      // signed-in user out.
      if (
        response.status === 401 &&
        !PUBLIC_AUTH_ENDPOINTS.has(endpoint.split("?")[0] || endpoint) &&
        !options.skipAuthExpiredEvent
      ) {
        this.clearToken();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("vaultauth:session_expired", {
              detail: { message: responseBody?.error?.message || "Session expired." },
            })
          );
        }
      }

      // Determine clean error code
      let errorCode = responseBody?.error?.code;
      if (!errorCode) {
        if (response.status === 401) {
          errorCode = endpoint.includes("/auth/login") ? "ERR_INVALID_CREDENTIALS" : "ERR_UNAUTHENTICATED";
        } else if (response.status === 403) {
          errorCode = "ERR_FORBIDDEN";
        } else if (response.status === 404) {
          errorCode = "ERR_NOT_FOUND";
        } else if (response.status === 422) {
          errorCode = "ERR_WEAK_PASSWORD";
        } else if (response.status === 429) {
          errorCode = "ERR_RATE_LIMITED";
        } else {
          errorCode = `HTTP_${response.status}`;
        }
      }

      const errorPayload: ApiError = {
        status: response.status,
        code: errorCode,
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

  // --- High-Speed Parallel Health Handshake with Cold-Start Resilience ---
  async checkHealth(options?: { timeoutMs?: number; retries?: number }): Promise<{ ok: boolean; status: string; latency: number; details?: HealthCheckResponse }> {
    const startTime = performance.now();
    const timeoutMs = options?.timeoutMs ?? 2500;

    const probeEndpoint = async (path: string, timeout: number): Promise<boolean> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        return res.status < 500;
      } catch {
        return false;
      } finally {
        clearTimeout(timer);
      }
    };

    // Fast probe: ping /health directly
    let ok = await probeEndpoint("/health", timeoutMs);
    // Fallback: ping /.well-known/openid-configuration if /health failed
    if (!ok) {
      ok = await probeEndpoint("/.well-known/openid-configuration", timeoutMs);
    }

    const latency = Math.round(performance.now() - startTime);
    if (!ok) {
      return { ok: false, status: "offline", latency };
    }
    return { ok: true, status: "healthy", latency };
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
    return this.normalizeLoginResponse(res.data);
  }

  async verify2FA(payload: TwoFactorVerifyPayload): Promise<TwoFactorVerifyResponse> {
    const res = await this.request<TwoFactorVerifyResponse>("/api/v1/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.data.token) {
      this.setToken(res.data.token);
    }
    return this.normalizeLoginResponse(res.data);
  }

  /** Internal spec: POST /api/v1/auth/2fa/resend — { challenge_id } -> { status, message }. */
  async resend2FA(challengeId: string): Promise<AuthActionResponse> {
    const res = await this.request<AuthActionResponse>("/api/v1/auth/2fa/resend", {
      method: "POST",
      body: JSON.stringify({ challenge_id: challengeId }),
    });
    return res.data;
  }

  async register(payload: RegisterPayload): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  /**
   * Compatibility shim only. The internal OpenAPI specification defines no
   * email-verification endpoint, so calling this never issues a request and
   * never fakes success — it throws `ERR_ENDPOINT_UNAVAILABLE` instead.
   * Kept because legacy registration UI still imports the method name.
   */
  async verifyEmail(_email: string, _code: string): Promise<GenericMessageResponse> {
    throw endpointUnavailable(
      "verifyEmail",
      "Email verification is not available in the internal API"
    );
  }

  /**
   * Compatibility shim only — see `verifyEmail`. No resend endpoint exists in
   * the internal specification.
   */
  async resendVerifyEmail(_email: string): Promise<GenericMessageResponse> {
    throw endpointUnavailable(
      "resendVerifyEmail",
      "Email verification code resend is not available in the internal API"
    );
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    // Single authoritative endpoint from the internal spec. Real errors are
    // always propagated; no fallback route and no simulated success path.
    const res = await this.request<ChangePasswordResponse>("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    return res.data;
  }

  // --- Password recovery (public) ---
  async requestPasswordReset(email: string): Promise<AuthActionResponse> {
    const res = await this.request<AuthActionResponse>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return res.data;
  }

  async verifyResetCode(email: string, code: string): Promise<AuthActionResponse> {
    const res = await this.request<AuthActionResponse>("/api/v1/auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    return res.data;
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<AuthActionResponse> {
    const res = await this.request<AuthActionResponse>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
    return res.data;
  }

  // --- Two-factor administration ---
  async setOwn2FA(enabled: boolean, password: string): Promise<User2FAResponse> {
    const res = await this.request<User2FAResponse>("/api/v1/me/2fa", {
      method: "POST",
      body: JSON.stringify({ enabled, password }),
    });
    return res.data;
  }

  async adminSetUser2FA(userId: string, enforced: boolean): Promise<AdminEnforce2FAResponse> {
    this.invalidateUserCache();
    const res = await this.request<AdminEnforce2FAResponse>(
      `/api/v1/admin/users/${userId}/2fa`,
      {
        method: "POST",
        body: JSON.stringify({ enforced }),
      }
    );
    return res.data;
  }

  async adminResetUserPassword(userId: string): Promise<AdminActionResponse> {
    this.invalidateUserCache();
    const res = await this.request<AdminActionResponse>(
      `/api/v1/admin/users/${userId}/reset-password`,
      { method: "POST" }
    );
    return res.data;
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    try {
      if (token) {
        // Safe dispatch: does not throw or trigger unhandled errors
        await fetch(`${this.baseUrl}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }).catch(() => null);
      }
    } finally {
      this.clearToken();
    }
  }

  // --- Profile & User Sessions ---
  async getMe(options?: RequestOptions): Promise<UserProfile> {
    const res = await this.request<UserProfile>("/api/v1/me", { method: "GET", ...options });
    return res.data;
  }

  /**
   * Retrieves active sessions for the currently authenticated user.
   * Backends return { items: [...] } or { sessions: [...] } or direct array.
   */
  async getMySessions(): Promise<SessionItem[]> {
    const res = await this.request<any>("/api/v1/me/sessions", {
      method: "GET",
    });

    const rawList: any[] =
      res.data?.items ||
      res.data?.sessions ||
      (Array.isArray(res.data) ? res.data : []);

    const now = Date.now();

    // Filter strictly to existing, active, revokable sessions
    const activeList = rawList.filter((s) => {
      if (s.status && s.status.toUpperCase() !== "ACTIVE") return false;
      if (s.revoked_at || s.revoke_reason) return false;
      const expTime = s.idle_expires_at || s.expires_at || s.absolute_expires_at;
      if (expTime && new Date(expTime).getTime() <= now) return false;
      return true;
    });

    return activeList.map((s) => ({
      ...s,
      // Internal `SessionItem` uses `ip`, `device`, `current` and
      // `last_seen_at`; mirror them onto the legacy aliases the UI reads.
      ip: s.ip || s.ip_address || "Unknown IP",
      ip_address: s.ip_address || s.ip || "Unknown IP",
      device: s.device || s.user_agent || "Unknown Device",
      user_agent: s.user_agent || s.device || "Unknown Device",
      status: s.status || "ACTIVE",
      last_seen_at: s.last_seen_at || s.created_at,
      last_active_at: s.last_active_at || s.last_seen_at || s.created_at,
      is_current: s.current ?? s.is_current ?? false,
      current: s.current ?? s.is_current ?? false,
    }));
  }

  async revokeSession(sessionId: string): Promise<GenericMessageResponse> {
    const res = await this.request<GenericMessageResponse>(`/api/v1/sessions/${sessionId}`, {
      method: "DELETE",
    });
    return res.data;
  }

  // --- Administrator Endpoints ---
  async getOAuthClients(): Promise<OAuthClient[]> {
    const res = await this.request<any>("/api/v1/admin/oauth/clients", {
      method: "GET",
    });

    const rawList: any[] =
      res.data?.clients ||
      res.data?.items ||
      (Array.isArray(res.data) ? res.data : []);

    return rawList;
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
    const isUnfilteredAll =
      filter?.fetchAll &&
      !filter?.q &&
      (!filter?.role || filter.role === "All") &&
      (!filter?.status || filter.status === "All");

    // Return cached directory if fresh (< 20 seconds) to avoid redundant round-trips
    if (isUnfilteredAll && this.userDirectoryCache && Date.now() - this.userDirectoryCache.timestamp < 20_000) {
      return {
        users: [...this.userDirectoryCache.users],
        items: [...this.userDirectoryCache.users],
        total: this.userDirectoryCache.total,
        limit: filter?.limit || 100,
        offset: filter?.offset || 0,
      };
    }

    const params = new URLSearchParams();
    if (filter?.q) params.set("q", filter.q);
    if (filter?.role && filter.role !== "All") params.set("role", filter.role);
    if (filter?.status && filter.status !== "All") params.set("status", filter.status);
    const limit = Math.min(filter?.limit || 100, 100);
    params.set("limit", limit.toString());
    if (filter?.offset) params.set("offset", filter.offset.toString());

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await this.request<any>(
      `/api/v1/admin/users${queryString}`,
      { method: "GET" }
    );

    let userList: AdminUserListItem[] =
      res.data?.users ||
      res.data?.items ||
      (Array.isArray(res.data) ? res.data : []);

    const totalCount =
      typeof res.data?.total === "number" ? res.data.total : userList.length;

    // If fetchAll is requested, fetch the remaining pages in parallel. Start
    // after the rows actually returned (plus the caller's initial offset) so a
    // non-zero offset or a short first page cannot cause gaps/duplicates.
    let hadPageError = false;
    if (filter?.fetchAll && totalCount > userList.length) {
      const initialOffset = Math.max(0, filter?.offset ?? 0);
      const remainingOffsets: number[] = [];
      for (
        let offset = initialOffset + userList.length;
        offset < totalCount;
        offset += limit
      ) {
        remainingOffsets.push(offset);
      }

      const results = await Promise.all(
        remainingOffsets.map(async (offset) => {
          const pageParams = new URLSearchParams(params);
          pageParams.set("offset", offset.toString());
          pageParams.set("limit", limit.toString());
          try {
            const nextRes = await this.request<any>(
              `/api/v1/admin/users?${pageParams.toString()}`,
              { method: "GET" }
            );
            const nextBatch: AdminUserListItem[] =
              nextRes.data?.users ||
              nextRes.data?.items ||
              (Array.isArray(nextRes.data) ? nextRes.data : []);
            return nextBatch;
          } catch {
            // Per-page isolation: one failed page must not discard the rest.
            hadPageError = true;
            return [] as AdminUserListItem[];
          }
        })
      );

      const seen = new Set<string>();
      for (const user of userList) {
        const key = user.id || user.email;
        if (key) seen.add(key);
      }
      for (const batch of results) {
        for (const user of batch) {
          const key = user.id || user.email;
          if (key && seen.has(key)) continue;
          if (key) seen.add(key);
          userList.push(user);
        }
      }
      // Never report more rows than the authoritative total.
      userList = userList.slice(0, totalCount);
    }

    // Do not cache a partially fetched directory.
    if (isUnfilteredAll && !hadPageError) {
      this.userDirectoryCache = {
        users: userList,
        total: totalCount,
        timestamp: Date.now(),
      };
    }

    return {
      users: userList,
      items: userList,
      total: totalCount,
      limit: filter?.limit || 100,
      offset: filter?.offset || 0,
    };
  }

  async unlockUser(userId: string): Promise<GenericMessageResponse> {
    this.invalidateUserCache();
    const res = await this.request<GenericMessageResponse>(
      `/api/v1/admin/users/${userId}/unlock`,
      { method: "POST" }
    );
    return res.data;
  }

  async updateUserStatus(userId: string, status: "ACTIVE" | "DISABLED"): Promise<GenericMessageResponse> {
    this.invalidateUserCache();
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
    this.invalidateUserCache();
    const res = await this.request<GenericMessageResponse>(
      `/api/v1/admin/users/${userId}/role`,
      {
        method: "POST",
        body: JSON.stringify({ role }),
      }
    );
    return res.data;
  }

  async getAuditLogs(params?: { event?: string; limit?: number; offset?: number }): Promise<AuditLogItem[]> {
    const query = new URLSearchParams();
    if (params?.event && params.event !== "All") query.set("event", params.event);
    if (params?.limit) query.set("limit", params.limit.toString());
    if (params?.offset != null && params.offset > 0) query.set("offset", params.offset.toString());

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await this.request<any>(
      `/api/v1/admin/audit-logs${queryString}`,
      { method: "GET" }
    );

    const rawList: AuditLogItem[] =
      res.data?.audit_logs ||
      res.data?.logs ||
      res.data?.items ||
      (Array.isArray(res.data) ? res.data : []);

    // Internal schema uses `ip` and `ts`; keep the legacy aliases in sync.
    return rawList.map((log) => ({
      ...log,
      ip: log.ip ?? log.ip_address ?? null,
      ip_address: log.ip_address ?? log.ip ?? undefined,
      ts: log.ts || log.created_at || log.timestamp || "",
    }));
  }

  async getGlobalSessions(limit = 50): Promise<SessionItem[]> {
    const res = await this.request<any>(
      `/api/v1/admin/sessions?limit=${limit}`,
      { method: "GET" }
    );

    const rawList: AdminSessionItem[] =
      res.data?.sessions ||
      res.data?.items ||
      (Array.isArray(res.data) ? res.data : []);

    const now = Date.now();

    // Filter strictly to existing, active, revokable sessions
    const activeList = rawList.filter((s) => {
      if (s.status && s.status.toUpperCase() !== "ACTIVE") return false;
      if (s.revoked_at || s.revoke_reason) return false;
      const expTime = s.idle_expires_at || s.expires_at || s.absolute_expires_at;
      if (expTime && new Date(expTime).getTime() <= now) return false;
      return true;
    });

    return activeList.map((s) => ({
      ...s,
      // Internal AdminSessionItem uses `ip`, `device` and `email`; mirror them
      // onto the legacy aliases consumed by the admin session tables.
      ip: s.ip || s.ip_address || "Unknown IP",
      ip_address: s.ip_address || s.ip || "Unknown IP",
      device: s.device || s.user_agent || "Unknown Device",
      user_agent: s.user_agent || s.device || "Unknown Device",
      status: s.status || "ACTIVE",
      user_email: s.user_email || s.email || "Unknown User",
      email: s.email || s.user_email || "Unknown User",
      last_seen_at: s.last_seen_at || s.created_at,
      last_active_at: s.last_active_at || s.last_seen_at || s.created_at,
      expires_at: s.expires_at || s.idle_expires_at || s.absolute_expires_at,
    }));
  }
}

export const api = new ApiClient(DEFAULT_BASE_URL);

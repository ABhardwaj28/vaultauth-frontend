export type UserRole = "user" | "admin";
export type UserStatus = "PENDING" | "ACTIVE" | "LOCKED" | "DISABLED";
export type ClientType = "public" | "confidential";

export interface ApiError {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  rateLimitReset?: number;
  timestamp: string;
}

// --- User Profile & Governance ---
/**
 * Mirrors the internal `UserProfile` / `AdminUserItem` schemas.
 * `two_factor_enabled`, `two_factor_enforced` and `must_change_password` are the
 * canonical flags; `totp_enabled`, `updated_at`, `failed_attempts` and
 * `locked_until` are retained as optional compatibility fields.
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  totp_enabled?: boolean;
  two_factor_enabled?: boolean;
  two_factor_enforced?: boolean;
  must_change_password?: boolean;
  created_at: string;
  // Optional legacy / admin-only aliases used by existing components.
  updated_at?: string;
  failed_attempts?: number;
  locked_until?: string | null;
}

export interface AdminUserListItem extends UserProfile {
  last_login?: string | null;
}

export interface AdminUsersFilter {
  q?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
}

export interface AdminUsersResponse {
  users?: AdminUserListItem[];
  items?: AdminUserListItem[];
  total: number;
  limit: number;
  offset: number;
}

// --- Sessions ---
/**
 * Mirrors the internal `SessionItem` schema. The API returns `ip`, `device`,
 * `current` and `last_seen_at`; the other fields are optional legacy aliases
 * surfaced by the session UI.
 */
export interface SessionItem {
  id: string;
  device: string;
  ip: string | null;
  status: string;
  created_at: string;
  last_seen_at: string;
  idle_expires_at?: string | null;
  absolute_expires_at?: string | null;
  current?: boolean;
  // Optional legacy aliases used by existing components.
  user_id?: string;
  user_email?: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  last_active_at?: string;
  expires_at?: string | null;
  is_current?: boolean;
  revoked_at?: string | null;
  revoke_reason?: string | null;
}

/** Mirrors the internal `AdminSessionItem` schema (adds user identity). */
export interface AdminSessionItem extends SessionItem {
  user_id: string;
  email: string;
  idle_expires_at: string | null;
  absolute_expires_at: string | null;
}

// --- OAuth / OIDC Client Management ---
export interface OAuthClient {
  client_id: string;
  client_name: string;
  client_type: ClientType;
  redirect_uris: string[];
  allowed_scopes: string[];
  is_active?: boolean;
  created_at: string;
  client_secret?: string; // CRITICAL: Only returned once upon 201 Created!
}

export interface CreateOAuthClientPayload {
  client_name: string;
  client_type: ClientType;
  redirect_uris: string[];
  allowed_scopes: string[];
}

// --- Security Audit Trail ---
/** Mirrors the internal `AdminAuditLogItem` schema (`ip` + `ts` are canonical). */
export interface AuditLogItem {
  id: number | string;
  ts: string;
  event: string;
  actor_user_id?: string | null;
  target_user_id?: string | null;
  ip: string | null;
  details?: Record<string, unknown> | null;
  // Optional legacy aliases used by existing components.
  ip_address?: string;
  created_at?: string;
  timestamp?: string;
}

// --- Auth Endpoints Payload & Responses ---
export interface LoginPayload {
  email: string;
  password: string;
}

/** Mirrors the internal `LoginResponse` schema. */
export interface LoginResponse {
  token?: string | null;
  user_id?: string | null;
  email?: string | null;
  role?: UserRole | null;
  must_change_password?: boolean;
  two_factor_required?: boolean;
  method?: string | null;
  available_methods?: string[];
  challenge_id?: string | null;
  message?: string | null;
  // Optional legacy aliases kept for existing components; the API client
  // derives these from `two_factor_required` / `challenge_id`.
  state?: "OTP_REQUIRED" | "AUTHENTICATED";
  requires_2fa?: boolean;
  expires_in?: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface TwoFactorVerifyPayload {
  email?: string;
  code: string;
  challenge_id?: string;
}

/** `/api/v1/auth/2fa/verify` returns the same envelope as login. */
export type TwoFactorVerifyResponse = LoginResponse;

export interface ChangePasswordResponse {
  status?: string;
  message: string;
}

/** Response for forgot-password / verify-reset-code / reset-password. */
export interface AuthActionResponse {
  status?: string;
  message: string;
}

export interface User2FAResponse {
  status?: string;
  two_factor_enabled: boolean;
  two_factor_enforced: boolean;
  message: string;
}

export interface AdminEnforce2FAResponse {
  status?: string;
  two_factor_enforced: boolean;
  two_factor_enabled: boolean;
  message: string;
}

export interface AdminActionResponse {
  status?: string;
  message: string;
}

export interface GenericMessageResponse {
  message: string;
  status?: string;
}

export interface HealthCheckResponse {
  status: string;
  db?: string;
  database?: string;
}

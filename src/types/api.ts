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
 * `otp_enabled`, `mfa_enforced` and `must_change_password` are the canonical
 * flags; `totp_enabled`, `updated_at`, `failed_attempts` and `locked_until` are
 * retained as optional compatibility fields.
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  totp_enabled?: boolean;
  otp_enabled?: boolean;
  mfa_enforced?: boolean;
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
  /** Explicitly requested second factor. Only enrolled methods are accepted. */
  factor?: "otp" | "totp";
}

/** Mirrors the internal `LoginResponse` schema. */
export interface LoginResponse {
  token?: string | null;
  user_id?: string | null;
  email?: string | null;
  role?: UserRole | null;
  must_change_password?: boolean;
  mfa_required?: boolean;
  method?: "otp" | "totp" | string | null;
  /** Only enrolled factors: "otp", "totp", or both, with equal weight. */
  available_methods?: Array<"otp" | "totp" | string>;
  challenge_id?: string | null;
  message?: string | null;
  // Optional legacy aliases kept for existing components; the API client
  // derives these from `mfa_required` / `challenge_id`.
  state?: "OTP_REQUIRED" | "AUTHENTICATED";
  requires_mfa?: boolean;
  expires_in?: number;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface MfaVerifyPayload {
  code: string;
  challenge_id?: string;
}

/** `/api/v1/auth/mfa/verify` returns the same envelope as login. */
export type MfaVerifyResponse = LoginResponse;

export interface ResetPasswordValidateResponse {
  valid: boolean;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  status?: string;
  message: string;
}

/** Response for forgot-password / reset-password-link / reset-password. */
export interface AuthActionResponse {
  status?: string;
  message: string;
}

export interface UserOtpResponse {
  status?: string;
  otp_enabled: boolean;
  mfa_enforced: boolean;
  message: string;
}

/** POST /api/v1/me/totp/enroll — starts enrollment with the otpauth URI. */
export interface TOTPEnrollResponse {
  otpauth_uri: string;
  message?: string;
}

/** POST /api/v1/me/totp/confirm and /recovery-codes/regenerate. */
export interface RecoveryCodesResponse {
  recovery_codes: string[];
  message?: string;
}

/** POST /api/v1/me/totp/disable — password and/or a current code. */
export interface TOTPDisablePayload {
  password?: string | null;
  code?: string | null;
}

export interface AdminEnforceMfaResponse {
  status?: string;
  mfa_enforced: boolean;
  otp_enabled: boolean;
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

/**
 * VaultAuth SSO — Comprehensive API Type Contracts
 * Strict schemas for Authentication, Governance, OAuth/OIDC, and Normalized Errors
 */

export type UserRole = "user" | "admin";
export type UserStatus = "ACTIVE" | "LOCKED" | "DISABLED" | "PENDING";
export type ClientType = "confidential" | "public";

// --- Normalized Error Model ---
export interface ApiError {
  status: number;          // HTTP status code (0 for network/offline)
  code: string;            // e.g. ERR_INVALID_CREDENTIALS, ERR_UNAUTHENTICATED, ERR_FORBIDDEN, ERR_NOT_FOUND, ERR_WEAK_PASSWORD, ERR_RATE_LIMITED, ERR_NETWORK
  message: string;         // Safe human-readable message from error.message
  requestId?: string;      // error.request_id or X-Request-ID response header
  rateLimitReset?: number; // Parsed Unix timestamp from X-RateLimit-Reset when status === 429
  timestamp: string;       // ISO-8601 timestamp
}

// --- User Profile & Governance ---
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  totp_enabled?: boolean;
  failed_attempts?: number;
  locked_until?: string | null;
  created_at: string;
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
}

export interface AdminUsersResponse {
  items: AdminUserListItem[];
  total: number;
  limit: number;
  offset: number;
}

// --- Sessions ---
export interface SessionItem {
  id: string;
  user_id?: string;
  user_email?: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_active_at?: string;
  expires_at?: string;
  absolute_expires_at?: string;
  is_current?: boolean;
  current?: boolean;
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
export interface AuditLogItem {
  id: number | string;
  ts: string;
  event: string;
  actor_user_id?: string | null;
  target_user_id?: string | null;
  ip_address?: string;
  ip?: string;
  details?: Record<string, unknown> | null;
}

// --- Auth Endpoints Payload & Responses ---
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  state?: "OTP_REQUIRED" | "AUTHENTICATED";
  challenge_id?: string;
  expires_in?: number;
  token?: string;
  user_id?: string;
  email?: string;
  role?: UserRole;
  requires_2fa?: boolean;
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

export interface TwoFactorVerifyResponse {
  token: string;
  user_id?: string;
  email: string;
  role: UserRole;
}

export interface GenericMessageResponse {
  message: string;
  status?: string;
}

export interface HealthCheckResponse {
  status: string;
  db?: string;
  database?: string;
  version?: string;
}

// Standard OIDC Token Claims (Authentik-compatible)
export interface OIDCTokenClaims {
  sub: string;
  email: string;
  name: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email_verified: boolean;
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  auth_time: number;
  nonce?: string;
  at_hash?: string;
  groups?: string[];
  roles?: string[];
  [key: string]: unknown;
}

// Simplified user session
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  organization?: string;
  groups?: string[];
  metadata?: Record<string, unknown>;
}

// Role definitions
export type UserRole = 'dosen' | 'mahasiswa' | 'admin_akademik' | 'kaprodi' | 'jurusan';

// Permission definitions
export interface Permission {
  resource: string;
  action: string;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  dosen: [
    { resource: 'jadwal', action: 'read' },
    { resource: 'kehadiran', action: 'write' },
    { resource: 'nilai', action: 'write' },
    { resource: 'mahasiswa', action: 'read' },
  ],
  mahasiswa: [
    { resource: 'jadwal', action: 'read' },
    { resource: 'kehadiran', action: 'read' },
    { resource: 'nilai', action: 'read' },
    { resource: 'profile', action: 'write' },
  ],
  admin_akademik: [
    { resource: '*', action: '*' },
  ],
  kaprodi: [
    { resource: 'prodi', action: 'write' },
    { resource: 'kurikulum', action: 'write' },
    { resource: 'dosen', action: 'read' },
    { resource: 'mahasiswa', action: 'read' },
    { resource: 'laporan', action: 'read' },
  ],
  jurusan: [
    { resource: 'dosen', action: 'read' },
    { resource: 'laporan', action: 'read' },
    { resource: 'jadwal', action: 'read' },
  ],
};

// Authentik OIDC configuration
export interface AuthentikConfig {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

// Default OIDC scopes for Authentik
export const DEFAULT_OIDC_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
] as const;

// Authentik Group to Role mapping
export const GROUP_ROLE_MAP: Record<string, UserRole> = {
  dosen: 'dosen',
  mahasiswa: 'mahasiswa',
  admin_akademik: 'admin_akademik',
  kaprodi: 'kaprodi',
  jurusan: 'jurusan',
};

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

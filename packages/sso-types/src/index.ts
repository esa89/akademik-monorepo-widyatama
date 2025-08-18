// Token Claims from Zitadel
export interface ZitadelTokenClaims {
  sub: string; // user ID
  email: string;
  name: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email_verified: boolean;
  iss: string; // issuer
  aud: string[]; // audience
  exp: number; // expiration
  iat: number; // issued at
  auth_time: number;
  urn:zitadel:iam:org:project:roles?: Record<string, Record<string, string>>;
  urn:zitadel:iam:org:id?: string;
  urn:zitadel:iam:user:metadata?: Record<string, any>;
}

// Simplified user session
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  organization?: string;
  metadata?: Record<string, any>;
}

// Role definitions
export type UserRole = 'dosen' | 'mahasiswa' | 'admin_akademik' | 'kaprodi';

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
};

// API Response types
export interface ApiResponse<T = any> {
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

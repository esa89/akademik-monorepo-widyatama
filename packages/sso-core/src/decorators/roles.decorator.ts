import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@widyatama/sso-types';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route or controller
 * @example
 * @Roles('dosen', 'admin_akademik')
 * @Controller('nilai')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to specify required permissions for a route or controller
 * @example
 * @Permissions({ resource: 'nilai', action: 'write' })
 * @Controller('nilai')
 */
export const Permissions = (
  ...permissions: { resource: string; action: string }[]
) => SetMetadata(PERMISSIONS_KEY, permissions);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SessionUser } from '@widyatama/sso-types';

/**
 * Decorator to get the current authenticated user from the request
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: SessionUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof SessionUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: SessionUser = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);

/**
 * Decorator to get the user's roles
 * @example
 * @Get('admin-only')
 * adminRoute(@UserRoles() roles: UserRole[]) {
 *   // roles = ['admin_akademik']
 * }
 */
export const UserRoles = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: SessionUser = request.user;
    return user?.roles || [];
  },
);

/**
 * Decorator to check if user has a specific role
 * @example
 * @Get('dosen-only')
 * dosenRoute(@HasRole('dosen') isDosen: boolean) {
 *   // isDosen = true/false
 * }
 */
export const HasRole = (role: string) =>
  createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: SessionUser = request.user;
    return user?.roles.includes(role as any) || false;
  })();

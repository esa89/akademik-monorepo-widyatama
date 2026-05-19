import { Module, DynamicModule, Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthentikJwtStrategy, JwtStrategyOptions } from './jwt.strategy';
import { JwtAuthGuard } from './auth.guard';
import { RolesGuard, PermissionGuard } from './roles.guard';

export interface AuthModuleOptions extends JwtStrategyOptions {
  global?: boolean;
}

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    const strategyProvider: Provider = {
      provide: AuthentikJwtStrategy,
      useFactory: () => new AuthentikJwtStrategy(options),
    };

    return {
      module: AuthModule,
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        strategyProvider,
        JwtAuthGuard,
        RolesGuard,
        PermissionGuard,
      ],
      exports: [JwtAuthGuard, RolesGuard, PermissionGuard, AuthentikJwtStrategy],
      global: options.global ?? true,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<AuthModuleOptions> | AuthModuleOptions;
    inject?: any[];
    global?: boolean;
  }): DynamicModule {
    const strategyProvider: Provider = {
      provide: AuthentikJwtStrategy,
      useFactory: async (...args: any[]) => {
        const config = await options.useFactory(...args);
        return new AuthentikJwtStrategy(config);
      },
      inject: options.inject || [],
    };

    return {
      module: AuthModule,
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        strategyProvider,
        JwtAuthGuard,
        RolesGuard,
        PermissionGuard,
      ],
      exports: [JwtAuthGuard, RolesGuard, PermissionGuard, AuthentikJwtStrategy],
      global: options.global ?? true,
    };
  }
}

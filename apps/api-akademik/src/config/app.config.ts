import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3015', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'api-akademik',
  version: process.env.APP_VERSION || '1.0.0',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH || 'api/docs',
  },
}));

import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// Keep local workspace commands consistent with the repository-root .env file.
loadEnv({ path: resolve(__dirname, '../../.env') });
import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().default('http://localhost:3000')
});
export const env = schema.parse(process.env);

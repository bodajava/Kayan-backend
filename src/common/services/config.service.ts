import { z } from 'zod';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(process.cwd(), 'config', '.env') });

const configSchema = z.object({
  PORT: z.string().default('3005').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_URL: z.string(),
  ENCRYPTION_KEY: z.string(),
  EMAIL_APP: z.string().email(),
  EMAIL_APP_PASSWORD: z.string(),
  REDIS_URI: z.string(),
  SALT_ROUND: z.string().default('10').transform(Number),
  
  USER_ACCESS_TOKE_SIGNATURE: z.string(),
  USER_REFRISH_TOKE_SIGNATURE: z.string(),
  SYSTEM_ACCESS_TOKE_SIGNATURE: z.string(),
  SYSTEM_REFRISH_TOKE_SIGNATURE: z.string(),
  
  ACCESS_EXPIRE_IN_DEV: z.string().transform(Number),
  REFRESH_EXPIRE_IN_DEV: z.string().transform(Number),
  ACCESS_EXPIRE_IN_PROD: z.string().transform(Number),
  REFRESH_EXPIRE_IN_PROD: z.string().transform(Number),
  
  CLIENT_GOOGLE_ID: z.string(),
  
  S3_REGION: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET_NAME: z.string(),
  AWS_EXPIRES_IN: z.string().default('900').transform(Number),
});

type Config = z.infer<typeof configSchema>;

class ConfigService {
  private readonly config: Config;

  constructor() {
    const result = configSchema.safeParse(process.env);

    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.format());
      process.exit(1);
    }

    this.config = result.data;
  }

  get<T extends keyof Config>(key: T): Config[T] {
    return this.config[key];
  }

  get isProd(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get isDev(): boolean {
    return this.config.NODE_ENV === 'development';
  }
}

export const configService = new ConfigService();

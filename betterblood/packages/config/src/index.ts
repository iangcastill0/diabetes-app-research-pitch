import { config } from 'dotenv';

// Load environment variables
config();

// Environment
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';

// Server Configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  API_VERSION: process.env.API_VERSION || 'v1',
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
};

// Database Configuration
export const DATABASE_CONFIG = {
  HOST: process.env.DB_HOST || 'localhost',
  PORT: parseInt(process.env.DB_PORT || '5432', 10),
  NAME: process.env.DB_NAME || 'betterblood',
  USER: process.env.DB_USER || 'betterblood',
  PASSWORD: process.env.DB_PASSWORD || 'betterblood',
  POOL_SIZE: parseInt(process.env.DB_POOL_SIZE || '20', 10),
  SSL: IS_PRODUCTION ? { rejectUnauthorized: false } : false,
};

// Redis Configuration
export const REDIS_CONFIG = {
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  PASSWORD: process.env.REDIS_PASSWORD,
  DB: parseInt(process.env.REDIS_DB || '0', 10),
};

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  ALGORITHM: 'HS256',
};

// Security Configuration
export const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  ENABLE_MFA: process.env.ENABLE_MFA === 'true',
};

// Logging Configuration
export const LOGGING_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || (IS_DEVELOPMENT ? 'debug' : 'info'),
  FORMAT: process.env.LOG_FORMAT || (IS_DEVELOPMENT ? 'pretty' : 'json'),
  ENABLE_FILE_LOGGING: process.env.ENABLE_FILE_LOGGING === 'true',
  FILE_PATH: process.env.LOG_FILE_PATH || './logs/app.log',
};

// CGM Configuration
export const CGM_CONFIG = {
  DEXCOM_CLIENT_ID: process.env.DEXCOM_CLIENT_ID || '',
  DEXCOM_CLIENT_SECRET: process.env.DEXCOM_CLIENT_SECRET || '',
  DEXCOM_REDIRECT_URI: process.env.DEXCOM_REDIRECT_URI || 'http://localhost:3000/auth/dexcom/callback',
  LIBRE_CLIENT_ID: process.env.LIBRE_CLIENT_ID || '',
  LIBRE_CLIENT_SECRET: process.env.LIBRE_CLIENT_SECRET || '',
  READING_INTERVAL_MINUTES: 5,
  TREND_CALCULATION_WINDOW: 15, // minutes
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  PUSH_PROVIDER: process.env.PUSH_PROVIDER || 'firebase',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  ENABLE_SMS: process.env.ENABLE_SMS === 'true',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
};

// FDA Compliance Configuration
export const FDA_CONFIG = {
  SOFTWARE_VERSION: process.env.SOFTWARE_VERSION || '1.0.0',
  ALGORITHM_VERSION: process.env.ALGORITHM_VERSION || 'ISPAD_2024',
  AUDIT_LOG_RETENTION_DAYS: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '3650', 10), // 10 years
  ENABLE_AUDIT_LOGGING: process.env.ENABLE_AUDIT_LOGGING !== 'false',
};

// AWS Configuration (for production)
export const AWS_CONFIG = {
  REGION: process.env.AWS_REGION || 'us-east-1',
  ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  S3_BUCKET: process.env.S3_BUCKET || 'betterblood-data',
  KMS_KEY_ID: process.env.KMS_KEY_ID || '',
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_INSULIN_DOSING: process.env.ENABLE_INSULIN_DOSING === 'true',
  ENABLE_AI_COACH: process.env.ENABLE_AI_COACH === 'true',
  ENABLE_CGM_INTEGRATION: process.env.ENABLE_CGM_INTEGRATION !== 'false',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
  ENABLE_AUDIT_UI: process.env.ENABLE_AUDIT_UI === 'true',
};

// Health Check Configuration
export const HEALTH_CONFIG = {
  ENABLED: true,
  PATH: '/health',
  CHECK_INTERVAL_MS: 30000,
};

// Validate required configuration
export const validateConfig = (): void => {
  const requiredInProduction = [
    'JWT_SECRET',
    'DB_PASSWORD',
  ];

  if (IS_PRODUCTION) {
    const missing = requiredInProduction.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

// Export all configurations
export default {
  env: NODE_ENV,
  isProduction: IS_PRODUCTION,
  isDevelopment: IS_DEVELOPMENT,
  isTest: IS_TEST,
  server: SERVER_CONFIG,
  database: DATABASE_CONFIG,
  redis: REDIS_CONFIG,
  jwt: JWT_CONFIG,
  security: SECURITY_CONFIG,
  logging: LOGGING_CONFIG,
  cgm: CGM_CONFIG,
  notifications: NOTIFICATION_CONFIG,
  fda: FDA_CONFIG,
  aws: AWS_CONFIG,
  features: FEATURE_FLAGS,
  health: HEALTH_CONFIG,
  validate: validateConfig,
};


import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Environment validation helper
function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

// Environment-specific configuration
const environment = process.env.NODE_ENV || 'development';

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: environment,
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  isTest: environment === 'test',

  // AI Configuration
  geminiApiKey: process.env.API_KEY || process.env.GEMINI_API_KEY,

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'aipc_dev',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN ?
      process.env.CORS_ORIGIN.split(',') :
      ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:7298'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    from: process.env.FROM_EMAIL || 'noreply@aipc.com',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // Healthcare Compliance
  compliance: {
    auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555', 10), // 7 years
    dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY,
  },

  // Third-party Integrations
  integrations: {
    paymentProviderApiKey: process.env.PAYMENT_PROVIDER_API_KEY,
    notificationServiceKey: process.env.NOTIFICATION_SERVICE_KEY,
  },
};

// Validation for critical configuration
export function validateConfig(): void {
  const errors: string[] = [];

  // Critical validations for production
  if (config.isProduction) {
    if (!config.geminiApiKey) {
      errors.push('GEMINI_API_KEY is required in production');
    }
    if (!config.jwt.secret) {
      errors.push('JWT_SECRET is required in production');
    }
    if (!config.database.url && !config.database.password) {
      errors.push('Database configuration is incomplete in production');
    }
    if (!config.compliance.dataEncryptionKey) {
      errors.push('DATA_ENCRYPTION_KEY is required for healthcare compliance');
    }
  }

  // Development warnings
  if (config.isDevelopment) {
    if (!config.geminiApiKey) {
      console.warn("⚠️  WARNING: GEMINI_API_KEY is not set. AI functionalities will fail.");
    }
    if (!config.jwt.secret) {
      console.warn("⚠️  WARNING: JWT_SECRET is not set. Using default (insecure for production).");
      config.jwt.secret = 'dev-secret-key-change-in-production';
    }
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }

  console.log(`✅ Configuration validated for ${config.nodeEnv} environment`);
}

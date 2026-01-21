import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Type-safe environment variables
export interface EnvConfig {
  DATABASE_URL?: string;
  PGHOST?: string;
  PGPORT?: string;
  PGDATABASE?: string;
  PGUSER?: string;
  PGPASSWORD?: string;
  PORT?: string;
  NODE_ENV?: string;
  CLIENT_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_CALLBACK_URL?: string;
  GITLAB_CLIENT_ID?: string;
  GITLAB_CLIENT_SECRET?: string;
  GITLAB_CALLBACK_URL?: string;
  GITLAB_BASE_URL?: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
  ALLOWED_DOMAINS?: string;
}

// Export for convenience (though process.env is globally available)
export default process.env as NodeJS.ProcessEnv & EnvConfig;

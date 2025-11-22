import pg from 'pg';
const { Pool } = pg;

export interface User {
  id: number;
  google_id?: string | null;
  github_id?: string | null;
  email: string;
  name: string;
  domain: string;
  avatar_url?: string | null;
  created_at: Date;
  last_login: Date;
}

export interface UserData {
  googleId?: string | null;
  githubId?: string | null;
  email: string;
  name: string;
  domain: string;
  avatarUrl?: string | null;
}

// DATABASE_URL takes priority over individual parameters if both are set
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'git_analytics',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

// Test connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('Database connection error:', err);
});

// User-related database queries

/**
 * Find user by provider and provider ID
 * @param provider - OAuth provider ('google' or 'github')
 * @param providerId - Provider-specific user ID
 * @returns User object or null if not found
 */
export async function findUserByProviderId(provider: 'google' | 'github', providerId: string): Promise<User | null> {
  try {
    const column = provider === 'google' ? 'google_id' : 'github_id';
    const result = await pool.query<User>(
      `SELECT id, google_id, github_id, email, name, domain, avatar_url, created_at, last_login
       FROM users
       WHERE ${column} = $1`,
      [providerId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error finding user by provider ID:', err);
    throw err;
  }
}

/**
 * Find user by Google ID
 * @param googleId - Google OAuth ID
 * @returns User object or null if not found
 */
export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  return findUserByProviderId('google', googleId);
}

/**
 * Find user by GitHub ID
 * @param githubId - GitHub OAuth ID
 * @returns User object or null if not found
 */
export async function findUserByGithubId(githubId: string): Promise<User | null> {
  return findUserByProviderId('github', githubId);
}

/**
 * Find user by email
 * @param email - User email address
 * @returns User object or null if not found
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await pool.query<User>(
      'SELECT id, google_id, github_id, email, name, domain, avatar_url, created_at, last_login FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error finding user by email:', err);
    throw err;
  }
}

/**
 * Create or update user (upsert with provider linking)
 * @param userData - User data from OAuth provider
 * @returns User object
 */
export async function upsertUser(userData: UserData): Promise<User> {
  try {
    const { googleId, githubId, email, name, domain, avatarUrl } = userData;

    // First, try to find existing user by email
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      // User exists - update to add new provider ID
      const result = await pool.query<User>(
        `UPDATE users SET
           google_id = COALESCE($1, google_id),
           github_id = COALESCE($2, github_id),
           name = $3,
           avatar_url = COALESCE($4, avatar_url),
           last_login = NOW()
         WHERE email = $5
         RETURNING id, google_id, github_id, email, name, domain, avatar_url, created_at, last_login`,
        [googleId, githubId, name, avatarUrl, email]
      );
      return result.rows[0];
    } else {
      // New user - insert
      const result = await pool.query<User>(
        `INSERT INTO users (google_id, github_id, email, name, domain, avatar_url, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING id, google_id, github_id, email, name, domain, avatar_url, created_at, last_login`,
        [googleId, githubId, email, name, domain, avatarUrl]
      );
      return result.rows[0];
    }
  } catch (err) {
    console.error('Error upserting user:', err);
    throw err;
  }
}

export default pool;

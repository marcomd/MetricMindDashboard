import pg from 'pg';
const { Pool } = pg;

export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  domain: string;
  avatar_url?: string | null;
  created_at: Date;
  last_login: Date;
}

export interface UserData {
  googleId: string;
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
 * Find user by Google ID
 * @param googleId - Google OAuth ID
 * @returns User object or null if not found
 */
export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  try {
    const result = await pool.query<User>(
      'SELECT id, google_id, email, name, domain, avatar_url, created_at, last_login FROM users WHERE google_id = $1',
      [googleId]
    );
    return result.rows[0] || null;
  } catch (err) {
    console.error('Error finding user by Google ID:', err);
    throw err;
  }
}

/**
 * Create or update user (upsert)
 * @param userData - User data from Google OAuth
 * @returns User object
 */
export async function upsertUser(userData: UserData): Promise<User> {
  try {
    const { googleId, email, name, domain, avatarUrl } = userData;
    const result = await pool.query<User>(
      `INSERT INTO users (google_id, email, name, domain, avatar_url, last_login)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (google_id)
       DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         domain = EXCLUDED.domain,
         avatar_url = EXCLUDED.avatar_url,
         updated_at = NOW(),
         last_login = NOW()
       RETURNING id, google_id, email, name, domain, avatar_url, created_at, last_login`,
      [googleId, email, name, domain, avatarUrl]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Error upserting user:', err);
    throw err;
  }
}

export default pool;

import pg from 'pg';
const { Pool } = pg;

// DATABASE_URL takes priority over individual parameters if both are set
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT || 5432,
      database: process.env.PGDATABASE || 'git_analytics',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

// Test connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// User-related database queries

/**
 * Find user by Google ID
 * @param {string} googleId - Google OAuth ID
 * @returns {Object|null} User object or null if not found
 */
export async function findUserByGoogleId(googleId) {
  try {
    const result = await pool.query(
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
 * @param {Object} userData - User data from Google OAuth
 * @param {string} userData.googleId - Google OAuth ID
 * @param {string} userData.email - User email
 * @param {string} userData.name - User name
 * @param {string} userData.domain - Email domain
 * @param {string} userData.avatarUrl - User avatar URL from Google
 * @returns {Object} User object
 */
export async function upsertUser(userData) {
  try {
    const { googleId, email, name, domain, avatarUrl } = userData;
    const result = await pool.query(
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

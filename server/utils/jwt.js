import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, name, domain
 * @returns {string} JWT token
 */
export const signToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    domain: user.domain,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    return null;
  }
};

/**
 * Extract token from cookies
 * @param {Object} req - Express request object
 * @returns {string|null} Token or null if not found
 */
export const extractTokenFromCookies = (req) => {
  return req.cookies?.token || null;
};

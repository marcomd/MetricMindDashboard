import { extractTokenFromCookies, verifyToken } from '../utils/jwt.js';

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const requireAuth = (req, res, next) => {
  const token = extractTokenFromCookies(req);

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      authenticated: false
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      authenticated: false
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
};

/**
 * Optional auth middleware - attaches user if token exists but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  const token = extractTokenFromCookies(req);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

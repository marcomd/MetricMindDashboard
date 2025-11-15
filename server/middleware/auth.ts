import { Request, Response, NextFunction } from 'express';
import { extractTokenFromCookies, verifyToken, JWTPayload } from '../utils/jwt.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractTokenFromCookies(req);

  if (!token) {
    res.status(401).json({
      error: 'Authentication required',
      authenticated: false
    });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({
      error: 'Invalid or expired token',
      authenticated: false
    });
    return;
  }

  // Attach user info to request
  req.user = decoded;
  next();
};

/**
 * Optional auth middleware - attaches user if token exists but doesn't require it
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractTokenFromCookies(req);

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

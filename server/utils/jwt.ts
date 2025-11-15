import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { User } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  id: number;
  email: string;
  name: string;
  domain: string;
  avatar_url?: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user
 * @param user - User object with id, email, name, domain, avatar_url
 * @returns JWT token
 */
export const signToken = (user: User): string => {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    domain: user.domain,
    avatar_url: user.avatar_url || null,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    console.error('JWT verification failed:', (err as Error).message);
    return null;
  }
};

/**
 * Extract token from cookies
 * @param req - Express request object
 * @returns Token or null if not found
 */
export const extractTokenFromCookies = (req: Request): string | null => {
  return req.cookies?.token || null;
};

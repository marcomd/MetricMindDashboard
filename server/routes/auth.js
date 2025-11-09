import express from 'express';
import passport from '../config/passport.js';
import { signToken, verifyToken, extractTokenFromCookies } from '../utils/jwt.js';

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * GET /auth/google
 * Initiates Google OAuth2 flow
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

/**
 * GET /auth/google/callback
 * Google OAuth2 callback handler
 */
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/auth/failure'
  }),
  (req, res) => {
    if (!req.user) {
      return res.redirect(`${CLIENT_URL}/unauthorized`);
    }

    // Generate JWT token
    const token = signToken(req.user);

    // Set JWT as httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: IS_PRODUCTION, // Only use secure cookies in production (HTTPS)
      sameSite: IS_PRODUCTION ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to client dashboard
    res.redirect(CLIENT_URL);
  }
);

/**
 * GET /auth/failure
 * Handles authentication failures
 */
router.get('/failure', (req, res) => {
  res.redirect(`${CLIENT_URL}/unauthorized`);
});

/**
 * GET /auth/check
 * Check if user is authenticated and return user info
 */
router.get('/check', (req, res) => {
  const token = extractTokenFromCookies(req);

  if (!token) {
    return res.json({
      authenticated: false,
      user: null
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    // Clear invalid token
    res.clearCookie('token');
    return res.json({
      authenticated: false,
      user: null
    });
  }

  res.json({
    authenticated: true,
    user: {
      email: decoded.email,
      name: decoded.name,
      domain: decoded.domain,
      avatar_url: decoded.avatar_url
    }
  });
});

/**
 * POST /auth/logout
 * Logout user by clearing the JWT cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;

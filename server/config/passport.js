import './env.js'; // Load environment variables first
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findUserByGoogleId, upsertUser } from '../db.js';

const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',') || ['iubenda.com', 'team.blue'];

// Passport serialization (not used with JWT, but required by Passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserByGoogleId(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth2 Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: 'No email found in Google profile' });
        }

        // Extract domain from email
        const domain = email.split('@')[1];

        // Validate domain
        if (!ALLOWED_DOMAINS.includes(domain)) {
          return done(null, false, {
            message: `Access denied. Only ${ALLOWED_DOMAINS.join(', ')} domains are allowed.`,
            invalidDomain: true,
            email
          });
        }

        // Extract avatar URL from Google profile
        const avatarUrl = profile.photos?.[0]?.value || null;

        // Upsert user in database
        const user = await upsertUser({
          googleId: profile.id,
          email: email,
          name: profile.displayName,
          domain: domain,
          avatarUrl: avatarUrl,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;

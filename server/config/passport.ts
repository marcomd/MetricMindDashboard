import './env.js'; // Load environment variables first
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { Strategy as GitLabStrategy } from 'passport-gitlab2';
import { upsertUser } from '../db.js';

interface User {
  id: number;
  google_id?: string | null;
  github_id?: string | null;
  gitlab_id?: string | null;
  email: string;
  name: string;
  domain: string;
  avatar_url?: string;
  created_at: Date;
  last_login: Date;
}

const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',') || ['iubenda.com', 'team.blue'];

// Passport serialization (not used with JWT, but required by Passport)
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    // Since we're using JWT, this is rarely used
    // For compatibility, we keep it but it won't be fully functional without provider info
    done(null, { id } as any);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth2 Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: GoogleVerifyCallback) => {
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
          } as any);
        }

        // Extract avatar URL from Google profile
        const avatarUrl = profile.photos?.[0]?.value || null;

        // Upsert user in database
        const user = await upsertUser({
          googleId: profile.id,
          githubId: null,
          email: email,
          name: profile.displayName,
          domain: domain,
          avatarUrl: avatarUrl,
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

// GitHub OAuth2 Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
      scope: ['user:email'],
    },
    async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: any) => {
      try {
        // GitHub may not provide email in profile, get it from emails array
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: 'No email found in GitHub profile. Please make sure your GitHub email is public.' });
        }

        // Extract domain from email
        const domain = email.split('@')[1];

        // Validate domain
        if (!ALLOWED_DOMAINS.includes(domain)) {
          return done(null, false, {
            message: `Access denied. Only ${ALLOWED_DOMAINS.join(', ')} domains are allowed.`,
            invalidDomain: true,
            email
          } as any);
        }

        // Extract avatar URL from GitHub profile
        const avatarUrl = profile.photos?.[0]?.value || profile._json?.avatar_url || null;

        // Upsert user in database
        const user = await upsertUser({
          googleId: null,
          githubId: profile.id,
          email: email,
          name: profile.displayName || profile.username || 'GitHub User',
          domain: domain,
          avatarUrl: avatarUrl,
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

// GitLab OAuth2 Strategy
passport.use(
  new GitLabStrategy(
    {
      clientID: process.env.GITLAB_CLIENT_ID!,
      clientSecret: process.env.GITLAB_CLIENT_SECRET!,
      callbackURL: process.env.GITLAB_CALLBACK_URL!,
      baseURL: process.env.GITLAB_BASE_URL || 'https://gitlab.com',
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        // GitLab provides email directly in profile
        const email = profile.emails?.[0]?.value || profile._json?.email;

        if (!email) {
          return done(null, false, { message: 'No email found in GitLab profile' });
        }

        // Extract domain from email
        const domain = email.split('@')[1];

        // Validate domain
        if (!ALLOWED_DOMAINS.includes(domain)) {
          return done(null, false, {
            message: `Access denied. Only ${ALLOWED_DOMAINS.join(', ')} domains are allowed.`,
            invalidDomain: true,
            email
          } as any);
        }

        // Extract avatar URL from GitLab profile
        const avatarUrl = profile.avatarUrl || profile._json?.avatar_url || null;

        // Upsert user in database
        const user = await upsertUser({
          googleId: null,
          githubId: null,
          gitlabId: profile.id,
          email: email,
          name: profile.displayName || profile.username || 'GitLab User',
          domain: domain,
          avatarUrl: avatarUrl,
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

export default passport;

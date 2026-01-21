import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/auth.js';
import { requireAuth } from './middleware/auth.js';
import { migrationRunner } from './utils/migrationRunner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL;

if (!CLIENT_URL) {
  throw new Error('CLIENT_URL is not set');
}

// Middleware
app.use(cors({
  origin: CLIENT_URL,
  credentials: true // Allow cookies
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Auth routes (public)
app.use('/auth', authRoutes);

// Health check (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (protected - requires authentication)
app.use('/api', requireAuth, apiRoutes);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // All other routes return React app
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Start server with migrations
async function startServer() {
  try {
    // Run database migrations before starting server
    console.log('🔄 Running database migrations...');
    const appliedCount = await migrationRunner.runPending();

    if (appliedCount > 0) {
      console.log(`✅ Applied ${appliedCount} migration(s)`);
    } else {
      console.log('✅ Database schema is up to date');
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 API server running on port ${PORT}`);
      console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Migration error - server will not start');
    process.exit(1);
  }
}

// Start the server
startServer();

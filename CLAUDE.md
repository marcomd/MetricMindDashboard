# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Metric Mind Dashboard is a full-stack analytics platform that visualizes git commit data from multiple repositories. The system extracts commit history from git repos (via external Ruby scripts), loads it into PostgreSQL, and presents interactive analytics through a React dashboard.

**Data Flow:**
```
Git Repos → Extract (Ruby) → JSON → Load (Ruby) → PostgreSQL → Express API → React Dashboard
```

## Development Commands

### Running the Application

```bash
# Install dependencies (run from root)
npm install
cd client && npm install && cd ..

# Development mode (runs both server and client concurrently)
npm run dev

# Server only (port 3000)
npm run server

# Client only (port 5173)
npm run client

# Production build
npm run build
npm start
```

### Client-Specific Commands

```bash
cd client

# Development server
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Backend Structure

**Server:** Express.js API (ES modules)
- `server/index.js` - Main server entry point, serves static React build in production
- `server/db.js` - PostgreSQL connection pool using `pg` library, includes user-related queries
- `server/routes/api.js` - All API endpoints (repos, trends, contributors, activity, comparison, etc.)
- `server/routes/auth.js` - Authentication endpoints (Google OAuth, logout, auth check)
- `server/config/passport.js` - Passport.js Google OAuth2 strategy with domain validation
- `server/utils/jwt.js` - JWT token generation and verification utilities
- `server/middleware/auth.js` - Authentication middleware for protecting routes

**Database:** PostgreSQL with materialized views for performance
- Raw commit data stored per-repository
- User authentication table: `users` (google_id, email, name, domain, timestamps)
- Materialized views: `mv_monthly_stats_by_repo`, `mv_monthly_category_stats`
- Regular views: `v_contributor_stats`, `v_daily_stats_by_repo`, `v_commit_details`, etc.
- Database connection configured via environment variables (see below)

### Frontend Structure

**React + Vite Application**
- `client/src/main.jsx` - Application entry point
- `client/src/App.jsx` - React Router configuration with AuthProvider and protected routes
- `client/src/contexts/` - React Context providers:
  - `AuthContext.jsx` - Authentication state management (user, login, logout, auth check)
- `client/src/components/` - Reusable components:
  - `Layout.jsx` - Navigation, header, footer, dark mode toggle, user info & logout button
  - `ProtectedRoute.jsx` - Route wrapper requiring authentication
  - `StatCard.jsx` - Animated metric cards with CountUp, gradient backgrounds, 6 color variants
  - `LoadingSpinner.jsx` - Standard loading indicator
- `client/src/pages/` - Route components:
  - `Login.jsx` - Google OAuth login page (public)
  - `Unauthorized.jsx` - Access denied page for non-authorized domains (public)
  - `Overview.jsx` - Repository cards and comparison summary (protected)
  - `Trends.jsx` - Monthly commit trends with area/line charts (protected)
  - `Contributors.jsx` - Top contributors with podium, charts, and searchable table (protected)
  - `Activity.jsx` - Calendar heatmap and daily activity patterns (protected)
  - `Comparison.jsx` - Side-by-side repository metrics comparison (protected)
  - `BeforeAfter.jsx` - Before/After analysis with date pickers and quick-action buttons (protected)
- `client/src/utils/api.js` - Axios API client with all endpoint functions, includes auth endpoints and 401 interceptor
- `client/src/utils/dateFormat.js` - Date formatting utilities for consistent dd/mm/yyyy display

**Routing Pattern:**
```javascript
// Public routes
/login → Login (Google OAuth)
/unauthorized → Unauthorized (access denied)

// Protected routes (require authentication)
/ → Overview
/trends → Trends
/contributors → Contributors
/activity → Activity
/comparison → Comparison
/before-after → BeforeAfter
```

### API Client Pattern

All API calls use the centralized `api.js` utility:
```javascript
import { fetchRepos, fetchMonthlyTrends, fetchContributors } from '../utils/api';

// Usage in components
fetchRepos().then(res => setData(res.data));
```

Base URL: `/api` (proxies to backend in dev, same origin in production)

### Key Design Patterns

**Page Component Structure:**
1. Import hooks and API functions
2. State management for data, loading, filters
3. `useEffect` for data fetching with dependencies
4. Conditional rendering (loading spinner, error states, empty states)
5. Main content with filters, charts, tables

**Styling System:**
- Tailwind CSS with custom configuration
- Dark mode: Class-based (`dark:` prefix), toggled via Layout component
- Custom classes: `.card`, `.stat-card`, `.btn-primary`, `.fade-in`, `.stagger-item`
- Color palette: Primary blue (#3b82f6), purple (#8b5cf6), green (#10b981), orange (#f59e0b)
- Smooth 300ms transitions throughout
- Custom scrollbars for webkit browsers

**Charting:**
- Recharts library for all visualizations
- Custom tooltips with dark mode support
- Responsive containers with aspect ratios
- Gradient definitions for area charts
- Consistent color arrays across charts

**Animations:**
- CountUp for number animations (2s duration)
- Fade-in for page loads
- Stagger animations for list items (50ms delays)
- Hover scale effects on cards (105%)

## Authentication

**Google OAuth2 with Domain Restriction**

The dashboard uses Google OAuth2 for authentication with domain-based access control. Only users with email addresses from authorized domains (@iubenda.com, @team.blue) can access the application.

### Architecture

**Backend Authentication Flow:**
1. User clicks "Continue with Google" on login page
2. Redirected to `/auth/google` (Passport.js OAuth2 strategy)
3. Google authentication and consent screen
4. Callback to `/auth/google/callback` with user profile
5. Domain validation (email domain must match ALLOWED_DOMAINS)
6. If authorized: Create/update user in database, generate JWT token, set httpOnly cookie
7. If unauthorized: Redirect to `/unauthorized` page
8. Redirect to dashboard home page

**Frontend Authentication:**
- `AuthContext` manages authentication state across the app
- `ProtectedRoute` wrapper prevents unauthorized access to dashboard pages
- User info (name, email) displayed in header with logout button
- API interceptor handles 401 responses by redirecting to login
- JWT token stored in httpOnly cookie (not accessible via JavaScript)

**Session Management:**
- JWT tokens expire after 7 days (configurable via JWT_EXPIRES_IN)
- Tokens stored in secure, httpOnly cookies
- Auth check endpoint (`/auth/check`) validates token on app load
- Logout clears cookie and redirects to login page

### Database Schema

The `users` table must be created in the extractor project database:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  domain VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
```

### Authentication Endpoints

**Backend Routes:**
- `GET /auth/google` - Initiates Google OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/check` - Check authentication status (returns user info if authenticated)
- `POST /auth/logout` - Logout user (clears cookie)

**All `/api/*` routes are protected** and require valid JWT token in cookie.

### Google Cloud Console Setup

To enable authentication, you must create OAuth2 credentials:

1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or People API)
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen (application name, authorized domains)
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
7. Copy the **Client ID** and **Client Secret** to your `.env` file

### Using Authentication in Code

**Frontend - Check Auth State:**
```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, authenticated, loading, logout } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!authenticated) return <Navigate to="/login" />;

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Backend - Protect Routes:**
```javascript
import { requireAuth } from '../middleware/auth.js';

// Protect individual routes
router.get('/sensitive-data', requireAuth, (req, res) => {
  // req.user contains decoded JWT payload (id, email, name, domain)
  res.json({ message: `Hello ${req.user.name}` });
});
```

### Security Notes

- JWT secret should be a strong random string in production (use `openssl rand -base64 32`)
- Cookies are httpOnly (not accessible via JavaScript) and secure in production (HTTPS only)
- CORS configured to allow credentials from CLIENT_URL only
- Tokens cannot be invalidated until expiry (consider shorter expiry times for sensitive data)
- All user passwords are managed by Google OAuth (no password storage in this app)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
PGHOST=localhost
PGPORT=5432
PGDATABASE=git_analytics
PGUSER=postgres
PGPASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT
JWT_SECRET=your_random_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Allowed Email Domains (comma-separated)
ALLOWED_DOMAINS=iubenda.com,team.blue
```

**Important:** Replace placeholder values with actual credentials before running the application. Never commit real credentials to version control.

## Adding New Pages

1. Create component in `client/src/pages/NewPage.jsx`
2. Follow existing page patterns (state, loading, API calls)
3. Add route in `client/src/App.jsx`:
   ```javascript
   import NewPage from './pages/NewPage';
   <Route path="new-page" element={<NewPage />} />
   ```
4. Add navigation links in `client/src/components/Layout.jsx` (desktop + mobile)
5. If new API endpoint needed, add to `server/routes/api.js` and `client/src/utils/api.js`

## Database Queries

All queries use the PostgreSQL pool from `server/db.js`:

```javascript
import pool from '../db.js';

router.get('/endpoint', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM view_name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
```

**Prefer materialized views** for expensive aggregations to improve performance.

## Data Categorization

Commits can be categorized by:
- **Categories**: Special tags in commit messages (e.g., `[BILLING]`, `[AUTH]`)
- **Work Types**: Derived from branch names (feature/*, bugfix/*, hotfix/*)

Related views: `v_category_stats`, `v_work_type_stats`, `v_category_by_repo`

## Date Formatting Convention

**Project Standard: dd/mm/yyyy format**

All dates displayed to users should follow the **dd/mm/yyyy** format (e.g., 25/12/2024).

**Utility Functions:**
Use `client/src/utils/dateFormat.js` for consistent date handling:

```javascript
import { formatDate, toISOFormat, fromISOFormat, addMonths } from '../utils/dateFormat';

// Format a Date object or ISO string for display
formatDate(new Date())  // "25/12/2024"

// Convert dd/mm/yyyy to yyyy-mm-dd (for HTML date inputs and API calls)
toISOFormat("25/12/2024")  // "2024-12-25"

// Convert yyyy-mm-dd to dd/mm/yyyy (for display)
fromISOFormat("2024-12-25")  // "25/12/2024"

// Add months to a date (yyyy-mm-dd format)
addMonths("2024-01-15", 6)  // "2024-07-15"
```

**HTML Date Inputs:**
- HTML `<input type="date">` uses yyyy-mm-dd format internally
- Store dates in state as yyyy-mm-dd
- Convert to dd/mm/yyyy only when displaying formatted text

**Database Dates:**
- PostgreSQL dates are handled as UTC
- API expects yyyy-mm-dd format
- Convert to dd/mm/yyyy for user-facing displays

## Important Notes

- Frontend runs on port **5173** (dev), backend on port **3000**
- In production, Express serves the React build from `client/dist`
- Dark mode state persists in browser localStorage
- All dates from PostgreSQL should be handled as UTC
- API responses use `result.rows` from pg library
- React Router v7 uses nested routes with `<Outlet />` in Layout
- CountUp component requires numeric values, not strings

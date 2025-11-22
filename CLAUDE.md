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
- `server/index.ts` - Main server entry point, serves static React build in production
- `server/db.ts` - PostgreSQL connection pool using `pg` library, includes user-related queries
- `server/routes/api.ts` - All API endpoints (repos, trends, contributors, activity, comparison, etc.)
- `server/routes/auth.ts` - Authentication endpoints (Google OAuth, logout, auth check)
- `server/config/passport.ts` - Passport.ts Google OAuth2 strategy with domain validation
- `server/utils/jwt.ts` - JWT token generation and verification utilities
- `server/middleware/auth.ts` - Authentication middleware for protecting routes

**Database:** PostgreSQL with materialized views for performance
- Raw commit data stored per-repository
- User authentication table: `users` (google_id, email, name, domain, timestamps)
- Materialized views: `mv_monthly_stats_by_repo`, `mv_monthly_category_stats`
- Regular views: `v_contributor_stats`, `v_daily_stats_by_repo`, `v_commit_details`, etc.
- Database connection configured via environment variables (see below)

### Frontend Structure

**React + Vite Application**
- `client/src/main.tsx` - Application entry point
- `client/src/App.tsx` - React Router configuration with AuthProvider and protected routes
- `client/src/contexts/` - React Context providers:
  - `AuthContext.tsx` - Authentication state management (user, login, logout, auth check)
- `client/src/components/` - Reusable components:
  - `Layout.tsx` - Navigation, header, footer, dark mode toggle, user info & logout button
  - `ProtectedRoute.tsx` - Route wrapper requiring authentication
  - `StatCard.tsx` - Animated metric cards with CountUp, gradient backgrounds, 6 color variants, weight efficiency display
  - `WeightBadge.tsx` - Color-coded weight efficiency indicator with tooltip (green/yellow/orange/red)
  - `LoadingSpinner.tsx` - Standard loading indicator
- `client/src/pages/` - Route components:
  - `Login.tsx` - Google OAuth login page (public)
  - `Unauthorized.tsx` - Access denied page for non-authorized domains (public)
  - `Overview.tsx` - Repository cards and comparison summary (protected)
  - `Trends.tsx` - Monthly commit trends with area/line charts (protected)
  - `Contributors.tsx` - Top contributors with podium, charts, and searchable table (protected)
  - `PersonalPerformance.tsx` - Individual contributor analytics with personal metrics, charts, and team comparison (protected)
  - `Activity.tsx` - Calendar heatmap and daily activity patterns (protected)
  - `Comparison.tsx` - Side-by-side repository metrics comparison (protected)
  - `BeforeAfter.tsx` - Before/After analysis with date pickers and quick-action buttons (protected)
  - `ContentAnalysis.tsx` - Category statistics, trends, and weight impact analysis (protected)
- `client/src/utils/api.ts` - Axios API client with all endpoint functions, includes auth endpoints and 401 interceptor
- `client/src/utils/dateFormat.ts` - Date formatting utilities for consistent dd/mm/yyyy display

**Routing Pattern:**
```javascript
// Public routes
/login → Login (Google OAuth)
/unauthorized → Unauthorized (access denied)

// Protected routes (require authentication)
/ → Overview
/trends → Trends
/contributors → Contributors
/personal-performance → PersonalPerformance
/activity → Activity
/comparison → Comparison
/before-after → BeforeAfter
/content-analysis → ContentAnalysis
```

### API Client Pattern

All API calls use the centralized `api.ts` utility:
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

**Weight Visualization:**
- WeightBadge component for efficiency indicators
- Gradual disclosure: only show when efficiency < 100%
- Color-coded badges (green/yellow/orange/red) based on weight efficiency
- Hover tooltips with detailed weight breakdown (total commits, effective commits, discounted)
- Charts use `weighted_lines_*` fields by default for accurate impact measurement
- StatCard displays effective commits with weight badges when applicable

## Weight Analysis System

**Commit and Category Weighting**

The system supports commit and category weighting to prioritize meaningful work and accurately measure developer impact:

**Backend Weight Calculation:**
- Stored in database views and materialized views
- `effective_commits = SUM(commit_weight * category_weight / 10000)`
- `weight_efficiency_pct = (effective_commits / total_commits) * 100`
- `weighted_lines_changed = SUM(lines_changed * commit_weight * category_weight / 10000)`

**Frontend Weight Display:**
- All charts default to `weighted_lines_changed/added/deleted` fields
- Weight badges appear when efficiency < 100%
- WeightBadge component provides visual feedback:
  - Green (100%): Full weight
  - Yellow (75-99%): Minor deductions
  - Orange (50-74%): Significant deductions
  - Red (<50%): Heavy deductions

**Component Usage:**
```javascript
import WeightBadge from '../components/WeightBadge';

<WeightBadge
  efficiency={85.5}
  totalCommits={100}
  effectiveCommits={85.5}
  size="md"
  showTooltip={true}
/>
```

**Weight Impact Section (Content Analysis):**
- Appears when overall efficiency < 100% or categories are de-prioritized
- Overview cards: Overall weight efficiency, effective commits, de-prioritized categories count
- De-prioritized categories table: Shows category, weight, total vs effective commits, discounted amount
- Repository weight efficiency chart: Horizontal bar chart comparing efficiency across repositories
- Only visible when weight analysis is relevant (gradual disclosure pattern)

**Database Fields:**
All major queries now return weight-related fields when available:
- `effective_commits` - Weighted commit count (may be fractional)
- `avg_weight` - Average commit weight (0-100)
- `weight_efficiency_pct` - Efficiency percentage
- `weighted_lines_changed/added/deleted` - Weighted line metrics
- `category_weight` - Category weight configuration (0-100, only in category endpoints)

These fields may be undefined in older data or when weights are not configured. Always handle as optional with appropriate fallbacks:
```javascript
const linesChanged = data.weighted_lines_changed || data.total_lines_changed || 0;
const efficiency = data.weight_efficiency_pct !== undefined ? parseFloat(data.weight_efficiency_pct) : 100;
```

## Authentication

**OAuth2 with Linked Accounts (Google & GitHub)**

The dashboard supports authentication via multiple OAuth2 providers (Google and GitHub) with domain-based access control. Only users with email addresses from authorized domains (@iubenda.com, @team.blue) can access the application.

**Account Linking:** A single user account is identified by email address. Users can login with either Google or GitHub, and both providers can be linked to the same account. When a user logs in with a second provider using the same email, that provider ID is added to their existing account.

### Architecture

**Backend Authentication Flow:**
1. User clicks "Continue with Google" or "Continue with GitHub" on login page
2. Redirected to `/auth/google` or `/auth/github` (Passport.js OAuth2 strategy)
3. OAuth provider authentication and consent screen
4. Callback to `/auth/google/callback` or `/auth/github/callback` with user profile
5. Domain validation (email domain must match ALLOWED_DOMAINS)
6. If authorized:
   - Check if user exists by email
   - If user exists: Update to add new provider ID (link accounts)
   - If new user: Create new account with provider ID
   - Generate JWT token, set httpOnly cookie
7. If unauthorized: Redirect to `/unauthorized` page
8. Redirect to dashboard home page

**Account Linking Example:**
- User first logs in with Google → Creates account with `google_id='123'`, `github_id=NULL`
- Same user later logs in with GitHub → Updates account to `google_id='123'`, `github_id='456'`
- User can now login with either provider

**Provider-Specific Notes:**
- **Google:** Requires Google+ API or People API enabled in Google Cloud Console
- **GitHub:** Requires user's primary email to be public and verified for domain validation

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

The `users` table supports linked OAuth accounts. To set up GitHub OAuth support, run the migration script at `migrations/add_github_oauth_support.sql`.

**Users Table Schema:**

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255),
  github_id VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  domain VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW()
);

-- Partial unique indexes (allow NULL but enforce uniqueness when present)
CREATE UNIQUE INDEX idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX idx_users_github_id_unique ON users(github_id) WHERE github_id IS NOT NULL;

-- Regular indexes for lookups
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_email ON users(email);
```

**Schema Design:**
- **email**: UNIQUE - One account per email address
- **google_id**: UNIQUE when not null - Each Google ID can only be used once
- **github_id**: UNIQUE when not null - Each GitHub ID can only be used once
- **Linked accounts**: Both `google_id` and `github_id` can be populated for the same user
- **Provider inference**: No separate `provider` field - determined by which ID is populated during login

### Authentication Endpoints

**Backend Routes:**
- `GET /auth/google` - Initiates Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback handler
- `GET /auth/github` - Initiates GitHub OAuth flow
- `GET /auth/github/callback` - GitHub OAuth callback handler
- `GET /auth/check` - Check authentication status (returns user info if authenticated)
- `POST /auth/logout` - Logout user (clears cookie)

**All `/api/*` routes are protected** and require valid JWT token in cookie.

### OAuth Provider Setup

**Google Cloud Console Setup:**

1. Go to https://console.cloud.google.com/
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or People API)
4. Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen (application name, authorized domains)
6. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
7. Copy the **Client ID** and **Client Secret** to your `.env` file

**GitHub Developer Settings Setup:**

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in application details:
   - **Application name:** Metric Mind Dashboard
   - **Homepage URL:** `http://localhost:5173` (development) or your production URL
   - **Authorization callback URL:** `http://localhost:3000/auth/github/callback`
4. Register the application
5. Copy the **Client ID** and generate a **Client Secret**
6. Add both to your `.env` file
7. **Important:** Users must have their primary email set to public in GitHub settings for authentication to work

### Using Authentication in Code

**Frontend - Login with Provider:**
```javascript
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const { login } = useAuth();

  return (
    <div>
      <button onClick={() => login('google')}>Login with Google</button>
      <button onClick={() => login('github')}>Login with GitHub</button>
    </div>
  );
}
```

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
import { requireAuth } from '../middleware/auth.ts';

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
- All user passwords are managed by OAuth providers (no password storage in this app)
- GitHub users must have public email addresses for domain validation to work

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
# Option 1: Use DATABASE_URL (takes priority over individual parameters)
DATABASE_URL=postgresql://user:password@host:port/database
# Option 2: Use individual parameters (if DATABASE_URL is not set)
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

# GitHub OAuth2
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# JWT
JWT_SECRET=your_random_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Allowed Email Domains (comma-separated)
ALLOWED_DOMAINS=iubenda.com,team.blue
```

**Important:** Replace placeholder values with actual credentials before running the application. Never commit real credentials to version control.

## Adding New Pages

1. Create component in `client/src/pages/NewPage.tsx`
2. Follow existing page patterns (state, loading, API calls)
3. Add route in `client/src/App.tsx`:
   ```javascript
   import NewPage from './pages/NewPage';
   <Route path="new-page" element={<NewPage />} />
   ```
4. Add navigation links in `client/src/components/Layout.tsx` (desktop + mobile)
5. If new API endpoint needed, add to `server/routes/api.ts` and `client/src/utils/api.ts`

## Personal Performance Page

### Overview

The Personal Performance page (`/personal-performance`) provides individual contributors with detailed analytics about their own contributions across all repositories. It displays personal metrics, team comparison, activity trends, and commit history.

### Features

#### 1. Filters Section
- **Date Range Pickers**: From/To date inputs with HTML5 date selectors
- **Quick Action Buttons**: Pre-set date ranges
  - Last 30 Days
  - Last 60 Days
  - Last 90 Days
  - This Year
  - All Time (clears date filters)
- **Repository Filter**: Dropdown to filter data by specific repository or view all repos combined
- **Weighted Data Toggle**: Switch between weighted (effective) and unweighted (raw) metrics

#### 2. Summary Statistics Cards (4 cards)
- **Total Commits**: Count of all commits by the user
  - Shows effective commits and weight badge if efficiency < 100%
- **Lines Changed**: Total lines added + deleted
- **Repositories**: Count of distinct repositories contributed to
- **Active Days**: Number of unique days with at least one commit

#### 3. Team Comparison Section (3 metrics)
- **% of Team Commits**: User's commits as percentage of total team commits
  - Shows ratio: `{user_commits} of {team_commits} total`
- **% of Team Lines**: User's lines changed as percentage of team total
  - Shows ratio: `{user_lines} of {team_lines} total`
- **Team Size**: Total number of active contributors

#### 4. Charts

**Commits Over Time** (AreaChart):
- X-axis: Date (formatted as dd/mm/yyyy)
- Y-axis: Number of commits (effective or total based on toggle)
- Gradient fill under the area curve
- Daily aggregation of commits

**Lines Changed Over Time** (LineChart):
- X-axis: Date
- Y-axis: Number of lines
- Three lines:
  - Lines Changed (blue) - Total lines added + deleted
  - Lines Added (green)
  - Lines Deleted (red)
- Uses weighted or unweighted metrics based on toggle

#### 5. Repository Breakdown Table

Columns:
- **Repository**: Repository name
- **Commits**: Total commits with weight badge if efficiency < 100%
- **Lines Changed**: Total lines changed (formatted with locale separators)
- **Weight**: Average commit weight as percentage

**Color Coding** (Weight column):
- Red (≤20%): Low priority commits
- Orange (21-50%): Medium priority commits
- Gray (>50%): Normal priority commits

#### 6. Category Breakdown Table

Shows user's contribution distribution across commit categories (BILLING, AUTH, etc.).

Columns:
- **Category**: Category name (or UNCATEGORIZED)
- **Commits**: Total commits with weight badge if efficiency < 100%
- **Lines Changed**: Total lines changed
- **Category Weight**: Category priority percentage

**Color Coding** (Category Weight column):
- Red (≤20%): De-prioritized category
- Orange (21-50%): Partially de-prioritized category
- Gray (>50% or 100%): Normal priority category

#### 7. Commit Details Table

Displays recent commits with configurable limit.

**Dynamic Limit Selection**:
- Dropdown selector: 50 (default), 100, or 200 commits
- Title updates dynamically: "Last {limit} commits"

Columns:
- **Date**: Commit date (dd/mm/yyyy format)
- **Repository**: Repository name
- **Message**: Commit subject (truncated to 2 lines with ellipsis)
  - Shows short hash below message (first 7 characters)
- **Category**: Commit category or "-" if uncategorized
- **Lines**: Lines added (+green) / deleted (-red) in stacked format
- **Weight**: Commit weight percentage

**Color Coding** (Weight column):
- Red (≤20%): Reverted or very low weight commits
- Orange (21-50%): Partially weighted commits
- Gray (>50%): Normal weight commits

### Data Flow

1. **User Authentication**: Retrieves logged-in user's email from `AuthContext`
2. **API Call**: `fetchPersonalPerformance(userEmail, repo, dateFrom, dateTo, limit)`
3. **Response Structure**:
   ```typescript
   {
     personal_stats: PersonalStats,
     daily_activity: DailyActivity[],
     repository_breakdown: RepoBreakdown[],
     category_breakdown: CategoryBreakdown[],
     commit_details: CommitDetail[],
     team_stats: TeamStats
   }
   ```
4. **Data Processing**:
   - Aggregates daily activity by date (handles multiple repos per day)
   - Parses PostgreSQL numeric types to JavaScript numbers
   - Calculates team comparison percentages
5. **Re-fetch Triggers**: Changes to `user`, `selectedRepo`, `dateFrom`, `dateTo`, or `commitLimit`

### Database Views Used

- **`v_daily_stats_by_author`**: Daily aggregated statistics per author and repository
  - Filters: `author_email`, `commit_date`, `repository_name`
  - Returns: commits, lines, weight metrics per day

- **`v_category_stats_by_author`**: Category breakdown per author
  - Filters: `author_email`
  - Returns: category-level aggregations with weight efficiency

- **`v_personal_commit_details`**: Individual commit records
  - Filters: `author_email`, `commit_date`, `repository_name`
  - Returns: commit details with hash, message, lines, weight
  - Limit: Dynamic (50/100/200)

### API Endpoint

**Route**: `GET /api/personal-performance`

**Query Parameters**:
- `authorEmail` (required): Email address of the user
- `repo` (optional): Repository name filter (default: all repos)
- `dateFrom` (optional): Start date in YYYY-MM-DD format
- `dateTo` (optional): End date in YYYY-MM-DD format
- `limit` (optional): Number of commits to return (default: 50, options: 50/100/200)

**Response**: JSON object with 6 data sections (see Data Flow above)

### State Management

```typescript
const [repos, setRepos] = useState<Repository[]>([]);           // Available repositories
const [selectedRepo, setSelectedRepo] = useState<string>('all'); // Current repo filter
const [dateFrom, setDateFrom] = useState<string>('');           // Start date (YYYY-MM-DD)
const [dateTo, setDateTo] = useState<string>('');               // End date (YYYY-MM-DD)
const [useWeightedData, setUseWeightedData] = useState<boolean>(true); // Toggle weighted metrics
const [commitLimit, setCommitLimit] = useState<number>(50);     // Commit details limit
const [loading, setLoading] = useState<boolean>(true);          // Loading state
const [data, setData] = useState<PerformanceData | null>(null); // API response data
```

### Key Implementation Details

1. **Numeric Type Handling**: All numeric values from PostgreSQL are parsed with `parseFloat()` to prevent TypeScript errors
2. **Empty States**: Each section conditionally renders only when data is available
3. **Loading State**: Shows `LoadingSpinner` component while fetching data
4. **Responsive Design**: Filters and cards adapt to mobile/tablet/desktop layouts
5. **Dark Mode**: All components support dark mode with proper color variants
6. **Weight Badges**: Automatically displayed when efficiency < 100% using gradual disclosure pattern

### Usage Example

```typescript
// Component usage (automatic via routing)
<Route path="personal-performance" element={<PersonalPerformance />} />

// API usage
import { fetchPersonalPerformance } from '../utils/api';

const data = await fetchPersonalPerformance(
  'user@example.com',  // User email
  'backend-api',       // Repository filter (or 'all')
  '2024-01-01',        // Date from
  '2024-12-31',        // Date to
  100                  // Commit limit
);
```

### Navigation

- **Menu Location**: "My Performance" link in sidebar (between Contributors and Activity)
- **Icon**: User icon from lucide-react
- **Access**: Protected route requiring authentication

## Database Queries

All queries use the PostgreSQL pool from `server/db.ts`:

```javascript
import pool from '../db.ts';

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
Use `client/src/utils/dateFormat.ts` for consistent date handling:

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

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
- `server/db.js` - PostgreSQL connection pool using `pg` library
- `server/routes/api.js` - All API endpoints (repos, trends, contributors, activity, comparison, etc.)

**Database:** PostgreSQL with materialized views for performance
- Raw commit data stored per-repository
- Materialized views: `mv_monthly_stats_by_repo`, `mv_monthly_category_stats`
- Regular views: `v_contributor_stats`, `v_daily_stats_by_repo`, `v_commit_details`, etc.
- Database connection configured via environment variables (see below)

### Frontend Structure

**React + Vite Application**
- `client/src/main.jsx` - Application entry point
- `client/src/App.jsx` - React Router configuration with Layout wrapper
- `client/src/components/` - Reusable components:
  - `Layout.jsx` - Navigation, header, footer, dark mode toggle (persisted in localStorage)
  - `StatCard.jsx` - Animated metric cards with CountUp, gradient backgrounds, 6 color variants
  - `LoadingSpinner.jsx` - Standard loading indicator
- `client/src/pages/` - Route components:
  - `Overview.jsx` - Repository cards and comparison summary
  - `Trends.jsx` - Monthly commit trends with area/line charts
  - `Contributors.jsx` - Top contributors with podium, charts, and searchable table
  - `Activity.jsx` - Calendar heatmap and daily activity patterns
  - `Comparison.jsx` - Side-by-side repository metrics comparison
- `client/src/utils/api.js` - Axios API client with all endpoint functions

**Routing Pattern:**
```javascript
/ → Overview
/trends → Trends
/contributors → Contributors
/activity → Activity
/comparison → Comparison
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
```

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

## Important Notes

- Frontend runs on port **5173** (dev), backend on port **3000**
- In production, Express serves the React build from `client/dist`
- Dark mode state persists in browser localStorage
- All dates from PostgreSQL should be handled as UTC
- API responses use `result.rows` from pg library
- React Router v7 uses nested routes with `<Outlet />` in Layout
- CountUp component requires numeric values, not strings

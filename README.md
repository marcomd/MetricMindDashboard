# Metric Mind Dashboard

An AI-driven developer productivity analytics system that extracts, stores, and visualizes git commit data from multiple repositories to measure the impact of development tools and practices.

## Overview

This system provides comprehensive analytics to answer questions like:
- How do commit patterns change over time?
- What's the impact of new AI tools on developer productivity?
- Which contributors are most active across projects?
- How do different repositories compare in terms of activity?

### Architecture

```
┌─────────────────┐
│ Git Repos       │
│ (Multiple)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Script  │ ← git_extract_to_json.rb
│ (per repo)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JSON Files      │ ← Intermediate storage
│ (per repo)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load Script     │ ← load_json_to_db.rb
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL DB   │
│ ┌─────────────┐ │
│ │ Raw Commits │ │ ← Per-commit detail
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ Aggregations│ │ ← Views for queries
│ └─────────────┘ │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Dashboard       │ ← This project
│ (WIP)   │
└─────────────────┘
```

## Building the Dashboard

This section provides functional requirements and specifications for building an interactive analytics dashboard on Replit. Replit will handle the technical implementation details.

### Dashboard Purpose

The dashboard should provide an intuitive, visually appealing interface to explore git productivity metrics and answer key questions:
- How is productivity trending over time?
- Who are the most active contributors?
- How do different repositories compare?
- What impact did tools or process changes have?

### Architecture Overview

```
┌─────────────────────────────────────────┐
│         Web Frontend (Browser)          │
│   ┌─────────────────────────────────┐   │
│   │ Dashboard Views                 │   │
│   │  • Overview                     │   │
│   │  • Trends                       │   │
│   │  • Contributors                 │   │
│   │  • Activity                     │   │
│   │  • Comparison                   │   │
│   │  • Before/After Analysis        │   │
│   └─────────────────────────────────┘   │
└───────────────┬─────────────────────────┘
                │ HTTP requests
                ▼
┌─────────────────────────────────────────┐
│           REST API Server               │
│  (Connects to existing PostgreSQL DB)  │
└─────────────────────────────────────────┘
```

### Step 1: Set Up Replit Project

**1.1 Create New Repl**
1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Select "Node.js" template
4. Name it "MetricMindDashboard"
5. Click "Create Repl"

**1.2 Project Structure**

Create the following folder structure:
```
git-analytics-dashboard/
├── server/                    # Backend API
│   ├── index.js              # Express server
│   ├── db.js                 # PostgreSQL connection
│   └── routes/
│       └── api.js            # API endpoints
├── client/                    # React frontend
│   ├── src/
│   │   ├── main.jsx          # Entry point
│   │   ├── App.jsx           # Main app component
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Dashboard views
│   │   ├── utils/            # Helper functions
│   │   └── styles/           # CSS files
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json               # Root package.json
└── .replit                    # Replit configuration
```

**1.3 Configure Replit**

Create `.replit` file:
```toml
run = "npm run dev"
entrypoint = "server/index.js"

[nix]
channel = "stable-23_05"

[deployment]
run = ["npm", "run", "start"]
deploymentTarget = "cloudrun"

[[ports]]
localPort = 3000
externalPort = 80

[[ports]]
localPort = 5173
externalPort = 3000
```

### Step 2: Set Up Backend API

**2.1 Install Backend Dependencies**

Create `package.json` in root:
```json
{
  "name": "git-analytics-dashboard",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "server": "nodemon server/index.js",
    "client": "cd client && npm run dev",
    "start": "node server/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "concurrently": "^8.2.2"
  }
}
```

Run: `npm install`

**2.2 Database Connection**

Create `server/db.js`:
```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'git_analytics',
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

export default pool;
```

**2.3 API Routes**

Create `server/routes/api.js`:
```javascript
import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all repositories
router.get('/repos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.name,
        r.description,
        COUNT(c.id) as total_commits,
        MAX(c.commit_date) as latest_commit,
        COUNT(DISTINCT c.author_email) as unique_authors
      FROM repositories r
      LEFT JOIN commits c ON r.id = c.repository_id
      GROUP BY r.id, r.name, r.description
      ORDER BY r.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching repositories:', err);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Get monthly trends for all repositories
//- **GET /api/monthly-trends** - Global monthly trends across all repositories
//  - Returns: Aggregated monthly data for all repositories combined
//  - Fields: month, total commits, total lines changed, unique authors, avg lines per commit
router.get('/monthly-trends', async (req, res) => {
  // WIP
});

// Get monthly trends for a repository
router.get('/monthly-trends/:repoName', async (req, res) => {
  try {
    const { repoName } = req.params;
    const result = await pool.query(`
      SELECT
        year_month,
        month_start_date,
        total_commits,
        total_lines_added,
        total_lines_deleted,
        total_lines_changed,
        unique_authors,
        avg_lines_changed_per_commit,
        avg_commits_per_author
      FROM mv_monthly_stats_by_repo
      WHERE repository_name = $1
      ORDER BY month_start_date DESC
      LIMIT 12
    `, [repoName]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching monthly trends:', err);
    res.status(500).json({ error: 'Failed to fetch monthly trends' });
  }
});

// Get top contributors across all repositories
router.get('/contributors', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const result = await pool.query(`
      SELECT
        author_name,
        author_email,
        total_commits,
        repositories_contributed,
        total_lines_changed,
        avg_lines_changed_per_commit
      FROM v_contributor_stats
      ORDER BY total_commits DESC
      LIMIT $1
    `, [limit]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching contributors:', err);
    res.status(500).json({ error: 'Failed to fetch contributors' });
  }
});

// Get daily activity for last N days
router.get('/daily-activity', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const result = await pool.query(`
      SELECT
        commit_date,
        repository_name,
        total_commits,
        total_lines_changed,
        unique_authors
      FROM v_daily_stats_by_repo
      WHERE commit_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY commit_date DESC, repository_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching daily activity:', err);
    res.status(500).json({ error: 'Failed to fetch daily activity' });
  }
});

// Compare repositories
router.get('/compare-repos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        repository_name,
        SUM(total_commits)::int as total_commits,
        SUM(total_lines_changed)::bigint as total_lines_changed,
        COUNT(DISTINCT year_month) as months_active,
        ROUND(AVG(unique_authors)::numeric, 1) as avg_authors_per_month,
        ROUND(AVG(avg_lines_changed_per_commit)::numeric, 1) as avg_lines_per_commit
      FROM mv_monthly_stats_by_repo
      WHERE month_start_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY repository_name
      ORDER BY total_commits DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error comparing repositories:', err);
    res.status(500).json({ error: 'Failed to compare repositories' });
  }
});

// Before/After analysis for a repository
router.get('/before-after/:repoName', async (req, res) => {
  try {
    const { repoName } = req.params;
    const { beforeStart, beforeEnd, afterStart, afterEnd } = req.query;

    const beforeResult = await pool.query(`
      SELECT
        AVG(avg_lines_changed_per_commit)::numeric as avg_lines_per_commit,
        AVG(total_commits)::numeric as avg_commits_per_month,
        AVG(unique_authors)::numeric as avg_authors
      FROM mv_monthly_stats_by_repo
      WHERE repository_name = $1
        AND month_start_date BETWEEN $2 AND $3
    `, [repoName, beforeStart, beforeEnd]);

    const afterResult = await pool.query(`
      SELECT
        AVG(avg_lines_changed_per_commit)::numeric as avg_lines_per_commit,
        AVG(total_commits)::numeric as avg_commits_per_month,
        AVG(unique_authors)::numeric as avg_authors
      FROM mv_monthly_stats_by_repo
      WHERE repository_name = $1
        AND month_start_date BETWEEN $2 AND $3
    `, [repoName, afterStart, afterEnd]);

    res.json({
      before: beforeResult.rows[0],
      after: afterResult.rows[0]
    });
  } catch (err) {
    console.error('Error in before/after analysis:', err);
    res.status(500).json({ error: 'Failed to perform before/after analysis' });
  }
});

export default router;
```

**2.4 Express Server**

Create `server/index.js`:
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api`);
});
```

**2.5 Environment Variables in Replit**

1. Click "Secrets" (lock icon) in left sidebar
2. Add these secrets:
   ```
   PGHOST=your-postgres-host
   PGPORT=5432
   PGDATABASE=git_analytics
   PGUSER=your-username
   PGPASSWORD=your-password
   NODE_ENV=production
   ```

### Step 3: Set Up React Frontend

**3.1 Initialize React Project**

In Replit Shell, run:
```bash
npm create vite@latest client -- --template react
cd client
npm install
```

**3.2 Install Frontend Dependencies**

```bash
npm install recharts axios react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**3.3 Configure Tailwind CSS**

Update `client/tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
```

**3.4 Update Vite Config**

Edit `client/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

**3.5 Setup Tailwind in CSS**

Update `client/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@layer components {
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-all hover:shadow-xl;
  }

  .stat-card {
    @apply bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg;
  }
}
```

### Step 4: Build Dashboard Components

**4.1 API Client Utility**

Create `client/src/utils/api.js`:
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const fetchRepos = () => api.get('/repos');
export const fetchMonthlyTrends = (repoName) => api.get(`/monthly-trends/${repoName}`);
export const fetchContributors = (limit = 20) => api.get(`/contributors?limit=${limit}`);
export const fetchDailyActivity = (days = 30) => api.get(`/daily-activity?days=${days}`);
export const fetchCompareRepos = () => api.get('/compare-repos');
export const fetchBeforeAfter = (repoName, params) =>
  api.get(`/before-after/${repoName}`, { params });

export default api;
```

**4.2 Layout Component**

Create `client/src/components/Layout.jsx`:
```javascript
import { Link, Outlet } from 'react-router-dom';
import { useState } from 'react';

function Layout() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  📊 Git Analytics
                </h1>
                <nav className="hidden md:flex space-x-6">
                  <Link to="/" className="nav-link">Overview</Link>
                  <Link to="/trends" className="nav-link">Trends</Link>
                  <Link to="/contributors" className="nav-link">Contributors</Link>
                  <Link to="/activity" className="nav-link">Activity</Link>
                  <Link to="/compare" className="nav-link">Compare</Link>
                </nav>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {darkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Git Productivity Analytics Dashboard
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
```

**4.3 Stat Card Component**

Create `client/src/components/StatCard.jsx`:
```javascript
function StatCard({ title, value, change, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`stat-card bg-gradient-to-br ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {change && (
            <p className="text-blue-100 text-sm mt-2">
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
            </p>
          )}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
}

export default StatCard;
```

### Step 5: Build Dashboard Pages

**5.1 Overview Page**

Create `client/src/pages/Overview.jsx`:
```javascript
import { useEffect, useState } from 'react';
import { fetchRepos, fetchCompareRepos } from '../utils/api';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Overview() {
  const [repos, setRepos] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchRepos(),
      fetchCompareRepos()
    ]).then(([reposRes, comparisonRes]) => {
      setRepos(reposRes.data);
      setComparison(comparisonRes.data);
      setLoading(false);
    }).catch(err => {
      console.error('Error loading data:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  const totalCommits = repos.reduce((sum, r) => sum + parseInt(r.total_commits || 0), 0);
  const totalAuthors = new Set(repos.flatMap(r => r.unique_authors)).size;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Your git productivity at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Repositories"
          value={repos.length}
          icon="📦"
          color="blue"
        />
        <StatCard
          title="Total Commits"
          value={totalCommits.toLocaleString()}
          icon="✨"
          color="purple"
        />
        <StatCard
          title="Contributors"
          value={totalAuthors}
          icon="👥"
          color="green"
        />
        <StatCard
          title="Active Repos"
          value={repos.filter(r => r.total_commits > 0).length}
          icon="🚀"
          color="orange"
        />
      </div>

      {/* Repository Cards */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Repositories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map(repo => (
            <div key={repo.id} className="card">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {repo.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {repo.description || 'No description'}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Commits:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {parseInt(repo.total_commits || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Contributors:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {repo.unique_authors}
                  </span>
                </div>
                {repo.latest_commit && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Latest:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(repo.latest_commit).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Chart */}
      {comparison.length > 0 && (
        <div className="card">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Repository Comparison (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="repository_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_commits" fill="#3b82f6" name="Total Commits" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default Overview;
```

**5.2 Monthly Trends Page**

Create `client/src/pages/Trends.jsx`:
```javascript
import { useEffect, useState } from 'react';
import { fetchRepos, fetchMonthlyTrends } from '../utils/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

function Trends() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepos().then(res => {
      setRepos(res.data);
      if (res.data.length > 0) {
        setSelectedRepo(res.data[0].name);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      fetchMonthlyTrends(selectedRepo).then(res => {
        // Reverse to show oldest first
        setTrends(res.data.reverse());
      });
    }
  }, [selectedRepo]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Monthly Trends</h2>
          <p className="text-gray-600 dark:text-gray-400">Track productivity over time</p>
        </div>
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
        >
          {repos.map(repo => (
            <option key={repo.id} value={repo.name}>{repo.name}</option>
          ))}
        </select>
      </div>

      {/* Commits Over Time */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Commits Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trends}>
            <defs>
              <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year_month" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="total_commits"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorCommits)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Lines Changed */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Lines Added vs Deleted
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year_month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_lines_added"
              stroke="#10b981"
              strokeWidth={2}
              name="Lines Added"
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="total_lines_deleted"
              stroke="#ef4444"
              strokeWidth={2}
              name="Lines Deleted"
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Average Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Commits/Month</h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {trends.length > 0
              ? Math.round(trends.reduce((sum, t) => sum + t.total_commits, 0) / trends.length)
              : 0}
          </p>
        </div>
        <div className="card">
          <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Lines/Commit</h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {trends.length > 0
              ? Math.round(trends.reduce((sum, t) => sum + parseFloat(t.avg_lines_changed_per_commit), 0) / trends.length)
              : 0}
          </p>
        </div>
        <div className="card">
          <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Contributors/Month</h4>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {trends.length > 0
              ? Math.round(trends.reduce((sum, t) => sum + t.unique_authors, 0) / trends.length)
              : 0}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Trends;
```

**5.3 Contributors Page**

Create `client/src/pages/Contributors.jsx`:
```javascript
import { useEffect, useState } from 'react';
import { fetchContributors } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Contributors() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributors(20).then(res => {
      setContributors(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Top Contributors</h2>
        <p className="text-gray-600 dark:text-gray-400">Leaderboard of most active developers</p>
      </div>

      {/* Top 3 Podium */}
      {contributors.length >= 3 && (
        <div className="flex justify-center items-end space-x-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🥈</div>
            <div className="bg-gradient-to-br from-gray-300 to-gray-400 text-white rounded-t-lg p-4 h-32 w-32 flex flex-col justify-end items-center">
              <p className="font-bold text-center text-sm">{contributors[1].author_name}</p>
              <p className="text-2xl font-bold">{contributors[1].total_commits}</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-t-lg p-4 h-40 w-32 flex flex-col justify-end items-center">
              <p className="font-bold text-center text-sm">{contributors[0].author_name}</p>
              <p className="text-3xl font-bold">{contributors[0].total_commits}</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">🥉</div>
            <div className="bg-gradient-to-br from-orange-300 to-orange-400 text-white rounded-t-lg p-4 h-24 w-32 flex flex-col justify-end items-center">
              <p className="font-bold text-center text-sm">{contributors[2].author_name}</p>
              <p className="text-2xl font-bold">{contributors[2].total_commits}</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Commits by Contributor
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={contributors.slice(0, 15)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="author_name" type="category" width={150} />
            <Tooltip />
            <Bar dataKey="total_commits" fill="#8b5cf6" animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Detailed Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Repos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lines Changed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Lines/Commit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {contributors.map((contributor, index) => (
                <tr key={contributor.author_email} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {contributor.author_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {contributor.author_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {contributor.total_commits.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {contributor.repositories_contributed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {parseInt(contributor.total_lines_changed).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {Math.round(contributor.avg_lines_changed_per_commit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Contributors;
```

### Step 6: Main App Setup

**6.1 Router Configuration**

Create `client/src/App.jsx`:
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Trends from './pages/Trends';
import Contributors from './pages/Contributors';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="trends" element={<Trends />} />
          <Route path="contributors" element={<Contributors />} />
          {/* Add more routes as needed */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
```

**6.2 Main Entry Point**

Update `client/src/main.jsx`:
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 7: Running the Dashboard

**7.1 Start Development Servers**

In Replit, click the "Run" button or in the Shell:
```bash
npm run dev
```

This starts both:
- Express API on port 3000
- React frontend on port 5173

**7.2 Access the Dashboard**

- Replit will provide a preview URL
- The dashboard should load with data from your PostgreSQL database
- Navigate between pages using the top navigation

### Step 8: Deployment

**8.1 Production Build**

Add to root `package.json`:
```json
{
  "scripts": {
    "build": "cd client && npm run build",
    "start": "node server/index.js"
  }
}
```

**8.2 Serve Static Files**

Update `server/index.js` to serve built React app:
```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// All other routes return React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

**8.3 Deploy on Replit**

1. Run `npm run build` to create production build
2. Click "Deploy" button in Replit
3. Your dashboard will be live at your Replit URL

### Tips for "WoW Effect" ✨

1. **Smooth Animations**: Recharts animations are enabled by default - adjust `animationDuration` for effect
2. **Color Gradients**: Use Tailwind gradient classes `bg-gradient-to-br from-blue-500 to-purple-600`
3. **Dark Mode**: Toggle creates dramatic visual change
4. **Hover Effects**: Add `hover:scale-105 transition-transform` to cards
5. **Loading States**: Spinning loaders keep users engaged
6. **Number Animations**: Consider `react-countup` for animated counters
7. **Responsive Charts**: ResponsiveContainer ensures perfect sizing
8. **Interactive Tooltips**: Recharts provides rich hover information

### Next Steps

- Add Activity Heatmap page (calendar-style visualization)
- Add Repository Comparison page with multi-series charts
- Add Before/After Analysis page with split views
- Implement real-time updates with WebSockets
- Add export functionality (PDF, CSV)
- Add filtering and date range selectors
- Implement user authentication

## Roadmap

TBD

## Contributing

This is an internal tool. For questions or suggestions, contact the development team.

## License

Internal use only.

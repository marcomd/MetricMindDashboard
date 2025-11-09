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

## Dashboard Specifications

### Purpose

The dashboard provides an intuitive, visually appealing interface to explore git productivity metrics and answer key questions:
- How is productivity trending over time?
- Who are the most active contributors?
- How do different repositories compare?
- What impact did tools or process changes have?

### Technology Stack

**Backend:**
- Node.js with Express
- PostgreSQL database connection
- RESTful API architecture
- CORS enabled for cross-origin requests

**Frontend:**
- React with Vite build tool
- React Router for navigation
- Recharts for data visualization
- Tailwind CSS for styling
- Axios for API requests

**Project Structure:**
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

### Dashboard Views

The dashboard includes the following pages:

1. **Overview** (`/`)
   - Total repositories, commits, contributors stats with animated counters
   - Repository cards with details
   - Comparison bar chart with gradient colors

2. **Trends** (`/trends`)
   - Monthly commit trends with smooth area charts
   - Lines changed vs added vs deleted visualization
   - Repository selector filter
   - Time range selector (3, 6, 12, 24 months)
   - Average metrics cards

3. **Contributors** (`/contributors`)
   - Top 3 podium visualization with medals
   - Horizontal bar chart
   - Detailed statistics table
   - Search functionality
   - Adjustable contributor count (10/20/50/100)

4. **Activity** (`/activity`)
  - **Purpose**: Track day-to-day commit patterns
  - **Key Components**:
    - Calendar heatmap showing commit activity (darker = more commits)
    - Timeline view showing recent commits
    - Activity distribution charts (by day of week, hour of day)
    - Repository filter to focus on specific projects
  - **User Experience**:
    - Quick identification of high/low activity periods
    - Visual patterns reveal work habits
    - Interactive filtering and date range selection
   - **User Experience**:
     - Quick identification of high/low activity periods
     - Visual patterns reveal work habits
     - Interactive filtering and date range selection

5. **Comparison** (`/comparison`)
  - **Purpose**: Compare repositories side-by-side
  - **Key Components**:
    - Side-by-side metrics cards for each repository
    - Multi-series bar chart comparing key metrics
    - Sortable table showing all comparison metrics
    - Percentage indicators showing relative activity
  - **User Experience**:
    - Easy identification of most/least active projects
    - Clear visual differentiation between repositories
    - Insights into resource allocation and project health

6. **Before/After Analysis** (`/before-after`)
  - **Purpose**: Measure impact of changes (new tools, processes, team changes)
  - **Key Components**:
    - Repository selector
    - Date range pickers for "Before" and "After" periods
    - Quick-action buttons (→ 3/6/12 months) to auto-set After period dates
    - Split-screen comparison cards showing metrics side-by-side
    - Percentage change indicators (↑ ↓) with color coding
    - Visualization comparing the two periods
    - Automated insights section highlighting key changes
  - **Metrics to Compare**:
    - Average commits per month
    - Average lines changed per commit
    - Average contributors per month
  - **User Experience**:
    - Clear visual separation of "before" vs "after"
    - Prominent percentage changes (green for improvement, red for decline)
    - Quick setup with preset time period buttons
    - Easy reconfiguration of time periods


### API Endpoints

The backend exposes these RESTful endpoints:

#### Repository Management
- **GET /api/repos** - List all repositories with summary statistics
  - Returns: Repository ID, name, description, total commits, latest commit date, contributor count

#### Trends & Analytics
- **GET /api/monthly-trends** - Global monthly trends across all repositories
  - Returns: Aggregated monthly data for all repositories combined
  - Fields: month, total commits, total lines changed, unique authors, avg lines per commit

- **GET /api/monthly-trends/:repoName** - Monthly trends for a specific repository
  - Returns: Monthly statistics for the specified repository
  - Fields: month, commits, lines added/deleted, authors, averages per author

#### Contributors
- **GET /api/contributors** - Top contributors across all repositories
  - Query params: `limit` (default: 20)
  - Returns: Contributor name, email, total commits, repositories contributed to, lines changed
  - Sorted by: Total commits (descending)

#### Activity
- **GET /api/daily-activity** - Daily commit activity
  - Query params: `days` (default: 30)
  - Returns: Date, repository, commits, lines changed, unique authors

#### Comparison & Analysis
- **GET /api/compare-repos** - Compare all repositories side-by-side
  - Returns: Repository statistics for last 6 months
  - Fields: total commits, lines changed, months active, avg authors, avg lines per commit

- **GET /api/before-after/:repoName** - Compare two time periods for impact analysis
  - Query params: `beforeStart`, `beforeEnd`, `afterStart`, `afterEnd`
  - Returns: Average metrics for "before" and "after" periods
  - Use case: Measure impact of tools, processes, or team changes

#### Content Analytics (Categories & Work Types)
- **GET /api/categories** - Category statistics across all repositories
  - Returns: Category name, total commits, unique authors, repositories, lines changed
  - Sorted by: Total commits (descending)

- **GET /api/work-types** - Work type statistics across all repositories
  - Returns: Work type (feature, bugfix, hotfix, etc), commits, authors, lines changed
  - Sorted by: Total commits (descending)

- **GET /api/categories/:repoName** - Category breakdown for specific repository
  - Returns: Categories with commit counts and metrics for the repository

- **GET /api/category-trends** - Monthly trends by category
  - Query params: `months` (default: 12)
  - Returns: Month, category, commits, authors, lines changed
  - Shows how work is distributed across categories over time

- **GET /api/work-type-trends** - Monthly trends by work type
  - Query params: `months` (default: 12)
  - Returns: Month, work type, commits, authors, lines changed
  - Shows distribution of feature work vs bugfixes over time

- **GET /api/category-work-matrix** - Cross-tabulation of categories and work types
  - Returns: Matrix showing commits for each category+work_type combination
  - Use case: "How many BILLING features vs BILLING bugfixes?"

### Database Views

Leverage existing views and materialized views:

- `mv_monthly_stats_by_repo` - Pre-computed monthly statistics
- `v_contributor_stats` - Aggregated contributor data
- `v_daily_stats_by_repo` - Daily activity aggregations
- `v_commit_details` - Detailed commit information with repository joins

Categorization creates these views:

- `v_category_stats` - Category statistics across all repos
- `v_work_type_stats` - Work type statistics
- `v_category_by_repo` - Category breakdown per repository (special tags in the title)
- `v_work_type_by_repo` - Work type breakdown per repository based on branch name
- `mv_monthly_category_stats` - Monthly category trends (materialized)
- `v_category_work_type_matrix` - Category + work type combinations
- `v_uncategorized_commits` - Commits needing categorization

### Design Specifications

**Design Philosophy:**
- Minimalist & elegant Apple-inspired design
- Smooth 300ms transitions throughout
- Soft shadows and refined spacing
- Responsive mobile layout with hamburger menu
- Custom styled scrollbars

**Color Palette:**
- **Primary Blue**: `#3b82f6` (buttons, accents)
- **Purple**: `#8b5cf6` (secondary stats, bars)
- **Green**: `#10b981` (success, positive metrics, additions)
- **Orange**: `#f59e0b` (warnings, highlights)
- **Red**: `#ef4444` (danger, deletions)
- **Background**: White / Gray-900 (dark mode)

**Animation Features:**
- Animated number counters (CountUp effect - 2s duration)
- Smooth chart transitions (1000ms)
- Stagger animations for lists (50ms delays)
- Hover scale effects on cards (105%)
- Fade-in animations for page loads

**Interactive Features:**
- Repository selector (all repos or specific)
- Time range selector (multiple options)
- Search bar for contributors
- Top N selector for leaderboard
- Dark mode toggle (persisted in localStorage)

### Environment Requirements

Required environment variables:
- `PGHOST` - PostgreSQL host
- `PGPORT` - PostgreSQL port (default: 5432)
- `PGDATABASE` - Database name (default: git_analytics)
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `NODE_ENV` - Environment (development/production)

### Deployment

The dashboard can be deployed on:
- **Replit**: Using `.replit` configuration
- **Local Development**: Using `npm run dev`
- **Production**: Using `npm run build` and `npm start`

Ports:
- Backend API: 3000
- Frontend Dev Server: 5173

### Future Enhancements

- Real-time updates with WebSockets
- Export functionality (PDF, CSV)
- Advanced filtering and date range selectors
- User authentication and authorization
- URL parameter sharing for Before/After analysis results
- Category and work type analytics pages
- Custom date range presets

## Roadmap

TBD

## Contributing

This is an internal tool. For questions or suggestions, contact the development team.

## License

Internal use only.

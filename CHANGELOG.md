# Changelog

All notable changes to Metric Mind Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2025-11-23

### Added
- **GitLab OAuth2 authentication support**: Users can now sign in with GitLab in addition to Google and GitHub
  - "Continue with GitLab" button on login page with GitLab's orange branding
  - GitLab OAuth strategy with domain validation
  - New authentication routes: `/auth/gitlab` and `/auth/gitlab/callback`
  - Support for both GitLab.com and self-hosted GitLab instances via `GITLAB_BASE_URL` environment variable
- **Enhanced linked account support**: Same email address can now login with all three providers (Google, GitHub, and GitLab)
  - User accounts support `google_id`, `github_id`, and `gitlab_id` simultaneously
  - Automatic account linking when logging in with any provider using the same email
  - Seamless switching between providers for authenticated sessions

### Changed
- **Database schema enhancement**: Added `gitlab_id` column to `users` table
  - Partial unique index on `gitlab_id` (UNIQUE when NOT NULL)
  - Updated all user-related queries to include GitLab ID field
- **Authentication flow improvements**: Extended OAuth strategy to support three concurrent providers
  - `findUserByProviderId()` now supports 'gitlab' as a provider option
  - New `findUserByGitlabId()` helper function for GitLab account lookup
  - `upsertUser()` updated to handle GitLab ID linking alongside Google and GitHub

### Technical Details
- Installed `passport-gitlab2` package for GitLab OAuth strategy
- Created database migration script: `migrations/add_gitlab_oauth_support.sql`
- Updated TypeScript interfaces across `server/db.ts`, `server/config/passport.ts`, and `server/routes/auth.ts`
- Enhanced `AuthContext.tsx` to accept GitLab provider: `login('gitlab')`
- Updated all authentication documentation in README.md and CLAUDE.md with GitLab setup instructions
- GitLab strategy configured with `read_user` scope for profile and email access

## [1.4.0] - 2025-11-22

### Added
- **GitHub OAuth2 authentication support**: Users can now sign in with GitHub in addition to Google
  - "Continue with GitHub" button on login page
  - GitHub OAuth strategy with domain validation
  - New authentication routes: `/auth/github` and `/auth/github/callback`
- **Linked account support**: Same email address can login with both Google and GitHub
  - User accounts identified by email, not provider
  - Both `google_id` and `github_id` can be linked to single account
  - Automatic account linking when logging in with second provider

### Changed
- **Database query optimization**: Updated authentication queries to use provider-specific ID columns directly
  - `findUserByProviderId()` now checks appropriate column based on provider
  - New `findUserByEmail()` helper function for account lookup
  - `upsertUser()` rewritten to support account linking via email matching

### Technical Details
- Added partial unique indexes on `google_id` and `github_id` (UNIQUE when NOT NULL)
- Installed `passport-github2` package for GitHub OAuth strategy
- Updated TypeScript interfaces across `server/db.ts`, `server/config/passport.ts`, and `server/routes/auth.ts`
- Enhanced `AuthContext.tsx` to accept provider parameter: `login('google')` or `login('github')`
- Updated all authentication documentation in README.md and CLAUDE.md

## [1.3.0] - 2025-01-22

### Added
- **Personal Performance page**: New dedicated page for individual contributor analytics
  - Summary stat cards showing total commits, lines changed, repositories contributed, and active days
  - Team comparison metrics displaying percentage of team commits and lines changed
  - Interactive charts: Commits over time (area chart) and lines changed/added/deleted over time (line chart)
  - Repository breakdown table showing contributions per repository with weight metrics
  - Category breakdown table showing category distribution with weight efficiency indicators
  - Commit details table with searchable/sortable list of personal commits
  - Custom date range filters with quick action buttons (Last 30/60/90 days, This year, All time)
  - Repository filter dropdown (all repos or specific repository)
  - Weighted vs unweighted data toggle
  - **Dynamic commit limit selection**: Dropdown to choose between last 50 (default), 100, or 200 commits
- **Color-coded weight columns** for better visual understanding:
  - Category Weight column: Red (≤20%), Orange (21-50%), Gray (>50%)
  - Commit Weight column: Red (≤20%), Orange (21-50%), Gray (>50%)
- New API endpoint `/api/personal-performance` with comprehensive personal metrics
- New frontend API client function `fetchPersonalPerformance()` with limit parameter support

### Changed
- Personal performance queries adapted to work with merged database views from extractor project
- Navigation menu updated with "My Performance" link (positioned between Contributors and Activity)

### Fixed
- PostgreSQL numeric types now properly parsed to JavaScript numbers to prevent `.toFixed()` errors
- Chart data aggregation correctly handles string-to-number conversion for weighted metrics
- Repository and category breakdown tables handle null/undefined numeric values gracefully

### Technical Details
- Created comprehensive PersonalPerformance.tsx component with 6 major sections
- Backend queries leverage personal views: `v_daily_stats_by_author`, `v_category_stats_by_author`, `v_personal_commit_details`
- All numeric values from PostgreSQL properly converted using `parseFloat()` before operations
- API endpoint supports dynamic LIMIT parameter (50/100/200) instead of hardcoded value
- Weight efficiency comparisons and calculations adapted for personal vs team metrics
- Added `commitLimit` state management with real-time API updates

## [1.2.0] - 2025-11-21

### Added
- **"Use Weighted Data" toggle**: Interactive checkbox on Content Analysis page to switch between weighted (effective) and unweighted (raw) commit data
- **Category weight support in filtered queries**: API endpoints now return `category_weight` field when date/repository filters are applied
- **Repository Weight Efficiency chart**: Moved from Content Analysis to Comparison page for better contextual placement
- **Comprehensive de-prioritized categories view**: Now displays ALL categories with weight < 100, not just those in top 15 by volume

### Changed
- **Default date range**: Content Analysis page now defaults to previous month (first day to last day) instead of last 3 months
- **Chart title indicators**: All charts display "(unweighted)" suffix when weighted data toggle is disabled
- **Weight Impact section**: Removed duplicate "Effective Commits" card, now shows only "Overall Weight Efficiency" and "De-prioritized Categories" count
- **De-prioritized categories sorting**: Categories are now sorted by commit volume (descending) to highlight most impactful work first

### Fixed
- **Effective commits calculation**: Fixed API endpoints `/categories` and `/category-by-repo` to correctly divide `SUM(c.weight)` by 100, resolving incorrect values (e.g., 4,900 instead of 49)
- **Disappearing categories bug**: De-prioritized categories no longer disappear when extending date ranges, as they're now calculated from full dataset instead of top-15-filtered data
- **Category weight missing**: Added `LEFT JOIN categories` to custom queries so `category_weight` field is available when filters are applied

### Technical Details
- Added `fullCategoryData` state in Content Analysis component to store unfiltered category data
- Updated SQL queries in `/api/categories` and `/api/category-by-repo` endpoints to include JOIN with `categories` table
- Modified GROUP BY clauses to include `cat.weight` for proper aggregation
- Enhanced Weight Impact section calculations to use full category dataset instead of top-15-limited data
- Moved Repository Weight Efficiency chart logic from ContentAnalysis.tsx to Comparison.tsx with adapted data mapping

## [1.1.1] - 2025-11-21

### Changed

- Standardized all backend endpoints to return effective_commits in the same format.
- Fixed 2 endpoints to divide by 100 in the SQL query: Contributors and Activity endpoint


## [1.1.0] - 2025-11-21

### Added
- **Weight Analysis System**: Comprehensive commit and category weighting functionality
  - Commit weights (0-100): Track reverted commits (0), partial weights (1-99), and full weights (100)
  - Category weights (0-100): Administrators can de-prioritize entire categories
  - Weight metrics displayed across all pages: effective_commits, avg_weight, weight_efficiency_pct
  - WeightBadge component: Color-coded badges (green/yellow/orange/red) with hover tooltips showing detailed weight breakdown
  - Weight Impact section in Content Analysis page: Shows de-prioritized categories table and repository efficiency comparison chart
  - Gradual disclosure UI pattern: Weight indicators only appear when efficiency < 100%

### Changed
- **All charts now display weighted metrics by default**: Charts use weighted_lines_changed, weighted_lines_added, weighted_lines_deleted instead of raw totals
- **Trends page**: Line and area charts display weighted line metrics, showing accurate impact of commits with reduced weights
- **Activity page**: Calendar heatmap and timeline use weighted_lines_changed when available
- **Comparison page**: Bar charts display weighted_lines_changed for accurate cross-repository comparison
- **Contributors page**: Table shows weighted_lines_changed and weight efficiency metrics
- **Overview page**: Statistics cards and tables incorporate weight data with effective commits display
- **Content Analysis page**: Added dedicated Weight Impact section with overview cards, de-prioritized categories analysis, and repository efficiency chart

### Technical Details
- Updated 12 API endpoints to include weight-related fields: effective_commits, avg_weight, weight_efficiency_pct, weighted_lines_added/deleted/changed
- TypeScript interfaces updated across all 7 page components to support optional weight fields
- Created reusable WeightBadge component with size variants (sm, md, lg) and tooltip functionality
- Enhanced StatCard component to display effective commits and weight badges
- Database queries now fetch weight columns from PostgreSQL views and materialized views
- All chart components handle weighted vs unweighted data gracefully with fallback logic

## [1.0.0] - 2025-11-19

### Added
- Monthly view with clickable chart interactions and corresponding API endpoint
- Cover image to README for better project presentation
- Project icon (icon.png) for branding

### Changed
- **BREAKING**: Migrated entire codebase from JavaScript to TypeScript for improved type safety and developer experience
- Updated all dependencies to latest stable versions
- Modernized test infrastructure with Vitest and Playwright

## [0.3.0] - 2025-11-19

### Added
- Summary report endpoint with detailed repository statistics
- Enhanced Overview page with advanced statistics and filtering capabilities
- Commits per committer metric in Before/After analysis
- API support for analyzing all repositories simultaneously
- Content Analysis page featuring category statistics and trends
- Category-based data visualization and API endpoints
- User avatar support in layout and user model
- Avatar component for consistent user profile display

### Changed
- Improved Vite configuration to support custom allowed hosts
- Refactored layout and navigation components with new sidebar functionality
- Integrated lucide-react icons throughout the application for modern UI
- Database configuration now prioritizes DATABASE_URL over individual connection parameters
- Updated environment variable documentation for clarity

### Fixed
- Before/After analysis now works correctly across all repositories
- Enhanced sidebar responsiveness on mobile devices

## [0.2.0] - 2025-11-19

### Added
- Google OAuth2 authentication with JWT token support
- Domain-based access control for authorized users
- Protected routes requiring authentication
- User session management with secure httpOnly cookies
- Authentication middleware and Passport.js integration
- Complete testing infrastructure (Vitest for unit tests, Playwright for E2E)
- Before/After analysis page with date range pickers and quick-action buttons
- Date formatting utilities for consistent dd/mm/yyyy display
- Repository comparison page with detailed metrics and sorting
- Activity page with calendar heatmap visualization using react-calendar-heatmap

### Changed
- Enhanced Contributors and Trends pages with advanced filtering options
- Improved data fetching logic across multiple pages
- Reorganized README with better structure and API endpoint documentation

## [0.1.0] - 2025-11-19

### Added
- Initial project setup with Express.js backend and React frontend
- PostgreSQL database integration with materialized views
- Repository overview dashboard with key metrics
- Trends page showing monthly commit patterns
- Contributors page with top contributor rankings
- Interactive charts using Recharts library
- Dark mode support with persistent user preferences
- Responsive design with Tailwind CSS
- API endpoints for repos, trends, contributors, and activity data
- Development environment with hot reload and concurrently running services

### Infrastructure
- Vite build system for fast development experience
- PostgreSQL connection pooling
- Environment-based configuration
- Concurrent development server for frontend and backend

---

## Version History Summary

- **1.5.0**: GitLab OAuth support with multi-provider linked accounts and self-hosted GitLab support
- **1.4.0**: GitHub OAuth support with linked accounts and simplified schema
- **1.3.0**: Personal Performance page with individual contributor analytics and UX improvements
- **1.2.0**: Weighted data toggle, improved category filtering, and UI refinements
- **1.1.1**: Standardized effective_commits format across endpoints
- **1.1.0**: Weight analysis system with commit and category weighting
- **1.0.0**: Production-ready release with TypeScript migration
- **0.3.0**: Enhanced analytics features and authentication improvements
- **0.2.0**: Security features and comprehensive testing
- **0.1.0**: Initial release with core analytics functionality

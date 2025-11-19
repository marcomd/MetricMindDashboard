# Changelog

All notable changes to Metric Mind Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **1.0.0**: Production-ready release with TypeScript migration
- **0.3.0**: Enhanced analytics features and authentication improvements
- **0.2.0**: Security features and comprehensive testing
- **0.1.0**: Initial release with core analytics functionality

# Quick Start Guide

## Prerequisites
- Node.js 22+ installed
- PostgreSQL database with git analytics data
- Environment variables configured in `.env`

## Running the Dashboard

### Start Development Servers

**Recommended: Clean start (if you have issues)**
```bash
# This script does all the work for you
./start.sh

# Or manually:
# Kill any existing processes
pkill -9 node

# Clear Vite cache
rm -rf client/node_modules/.vite

# Start servers
npm run dev
```

**Normal start:**
```bash
npm run dev
```

This starts both:
- Express API server on port 3000
- React frontend on port 5173

### Access the Dashboard

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## Environment Variables

Required in `.env`:
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=git_analytics
PGUSER=postgres
PGPASSWORD=your_password
```

## Build for Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

The production server will:
- Serve the built React app from `client/dist`
- Run the Express API on port 3000

## Deploy to Replit

1. Push code to GitHub
2. Import to Replit
3. Add environment variables in Secrets:
   - PGHOST
   - PGPORT
   - PGDATABASE
   - PGUSER
   - PGPASSWORD
4. Click "Run" - Replit will use `.replit` config
5. Deploy using the Deploy button

## Troubleshooting

### Port already in use
```bash
# Kill all node processes
pkill -9 node

# Or kill specific port
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Vite not loading styles
```bash
# Clear Vite cache
rm -rf client/node_modules/.vite

# Restart
npm run dev
```

### Database connection errors
- Check your `.env` file has correct credentials
- Ensure PostgreSQL is running
- Verify database name and permissions

## Usage Tips

- Use the repository selector to filter data by specific repository
- Toggle dark mode with the sun/moon button in the header
- Adjust time ranges and contributor counts using the filter controls
- Check the health endpoint to verify the API is running correctly

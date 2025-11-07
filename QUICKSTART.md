# Quick Start Guide

## 🚀 Running the Dashboard

### Prerequisites
- Node.js 22+ installed
- PostgreSQL database with git analytics data
- Environment variables configured in `.env`

### Start Development Servers

**Recommended: Clean start (if you have issues)**
```bash
# This script do all the work for you
./start.sh

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

### Access the Dashboard

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🎨 Features

### Overview Page (`/`)
- Total repositories, commits, contributors stats with animated counters
- Repository cards with details
- Comparison bar chart with gradient colors

### Trends Page (`/trends`)
- Monthly commit trends with smooth area charts
- Lines added vs deleted visualization
- Repository selector filter
- Time range selector (3, 6, 12, 24 months)
- Average metrics cards

### Contributors Page (`/contributors`)
- Top 3 podium visualization with medals
- Horizontal bar chart
- Detailed statistics table
- Search functionality
- Adjustable contributor count (10/20/50/100)

## 🎯 Special Features

### Animations
- Animated number counters (CountUp effect - 2s duration)
- Smooth chart transitions (1000ms)
- Stagger animations for lists (50ms delays)
- Hover scale effects on cards (105%)
- Fade-in animations for page loads

### Interactive Filters
- Repository selector (all repos or specific)
- Time range selector (multiple options)
- Search bar for contributors
- Top N selector for leaderboard

### Design
- Minimalist & elegant Apple-inspired design
- Dark mode toggle (persisted in localStorage)
- Smooth 300ms transitions throughout
- Soft shadows and refined spacing
- Responsive mobile layout with hamburger menu
- Custom styled scrollbars

## 📦 Build for Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🌐 Deploy to Replit

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

## 🔧 Environment Variables

Required in `.env`:
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=git_analytics
PGUSER=postgres
PGPASSWORD=your_password
```

## 🐛 Troubleshooting

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

## 🏆 Hackathon Tips

1. **Demo the animations**: Show the animated counters and smooth transitions
2. **Toggle dark mode**: Demonstrate the instant theme switch
3. **Use filters**: Show how you can drill down into specific repos and time ranges
4. **Highlight the podium**: The top 3 contributors visualization is eye-catching
5. **Show responsiveness**: Resize the browser to show mobile layout
6. **Showcase data**: Point out the real-time data from your PostgreSQL database

## 🎨 Color Palette

- **Primary Blue**: `#3b82f6` (buttons, accents)
- **Purple**: `#8b5cf6` (secondary stats)
- **Green**: `#10b981` (success, positive metrics)
- **Orange**: `#f59e0b` (warnings, highlights)
- **Background**: White / Gray-900 (dark mode)

Good luck with your hackathon! 🎉

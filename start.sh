#!/bin/bash

# Kill any processes using ports 3000 and 5173
echo "🔄 Cleaning up ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "✅ Ports cleared"
echo "🚀 Starting development servers..."
echo ""

# Start the dev servers
npm run dev

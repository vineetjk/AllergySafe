#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "=========================================================="
echo "  AllergySafe Table — Built for Maya"
echo "  Open-Source AI Co-Living Dining & Food Safety Platform"
echo "=========================================================="

cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI Backend
echo "🚀 Starting FastAPI Backend on http://localhost:8000..."
cd "$DIR/backend"
export PYTHONPATH=.
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# 2. Start Next.js Frontend
echo "✨ Starting Next.js Frontend on http://localhost:3000..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both services running!"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API Docs: http://localhost:8000/docs"
echo "Press CTRL+C to terminate both servers."
echo ""

wait

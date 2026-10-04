#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "=========================================================="
echo "  AllergySafe Table — Built for Prithvi"
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
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
echo "✨ Starting Next.js Frontend (accessible on laptop & mobile devices)..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both services running!"
echo "   • Laptop / Desktop: http://localhost:3000"
echo "   • Mobile Phone (same Wi-Fi): http://${LAN_IP}:3000"
echo "   • Backend API Docs: http://${LAN_IP}:8000/docs"
echo "Press CTRL+C to terminate both servers."
echo ""

wait

#!/bin/bash
set -e

echo "=== API GUARDIAN: STAR BUILD ==="

# Install Python deps
pip install -r requirements.txt

# Build React frontend
echo "Building React app..."
cd frontend
npm install
npm run build
cd ..

# CREATE & COPY static files
echo "Copying frontend to backend/static..."
rm -rf backend/static
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

# Verify it worked
if [ -f "backend/static/index.html" ]; then
    echo "SUCCESS: static/index.html found!"
else
    echo "ERROR: index.html NOT copied!"
    exit 1
fi

echo "BUILD COMPLETE – READY FOR TANZANIA!"
#!/bin/bash
set -e

echo "Installing Python deps..."
pip install -r requirements.txt

echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Copying frontend to backend/static..."
rm -rf backend/static
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

echo "Build complete! Ready for Render."
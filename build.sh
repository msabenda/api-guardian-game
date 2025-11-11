#!/bin/bash
set -e

echo "API GUARDIAN GAME"

# Install Python packages
pip install -r requirements.txt

# static folder is already committed — just check
if [ -f "backend/static/index.html" ] || [ -f "backend/static/KEEP_ME.html" ]; then
    echo "static folder DETECTED – GAME WILL LOAD!"
else
    echo "ERROR: static folder missing!"
    exit 1
fi

echo "DEPLOY SUCCESS!"
#!/bin/bash
set -e

echo "Installing Python packages..."
pip install -r requirements.txt

# WE ALREADY COPIED static MANUALLY — just verify
if [ -f "backend/static/index.html" ]; then
    echo "static folder ready! Game will load."
else
    echo "ERROR: backend/static/index.html missing!"
    exit 1
fi

echo "MANUAL BUILD COMPLETE – TANZANIA READY!"
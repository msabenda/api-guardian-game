#!/bin/bash
echo "Building API Guardian STAR..."

pip install -r requirements.txt

cd frontend
npm install
npm run build
cd ..

rm -rf backend/static
mkdir backend/static
cp -r frontend/dist/* backend/static/

echo "Build complete!"
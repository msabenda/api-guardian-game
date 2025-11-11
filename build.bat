@echo off
echo Building API Guardian STAR...

pip install -r requirements.txt

cd frontend
call npm install
call npm run build
cd ..

rmdir /s /q backend\static
mkdir backend\static
xcopy /e /i /y frontend\dist backend\static

echo Build complete! Ready for Render.
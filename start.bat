@echo off
cd /d "%~dp0"

echo ============================================
echo   SQL Practice - Build and Launch
echo ============================================
echo.

echo [1/2] Building frontend...
cd client
call npm run build
if errorlevel 1 (
    echo [FAIL] Build error
    cd ..
    pause
    exit /b 1
)
if not exist "dist\index.html" (
    echo [FAIL] dist\index.html missing
    cd ..
    pause
    exit /b 1
)
echo [ OK ] Frontend built
cd ..

echo.
echo [2/2] Starting server in background...
powershell -Command "Start-Process -WindowStyle Hidden -FilePath 'node' -ArgumentList 'server/index.js' -WorkingDirectory '%~dp0'"

timeout /t 6 /nobreak >nul
start http://localhost:3001

echo.
echo ============================================
echo   Opened http://localhost:3001
echo   Server running in background.
echo   This window will close in 3 seconds...
echo ============================================
timeout /t 3 /nobreak >nul
exit

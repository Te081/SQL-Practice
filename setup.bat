@echo off
setlocal enabledelayedexpansion
REM Switch to UTF-8 code page (Win10 1903+)
chcp 65001 >nul 2>&1
echo ============================================
echo   SQL Practice - Dependency Setup
echo ============================================
echo.

cd /d "%~dp0"

echo [0/2] Cleaning old dependencies (if any)...
if exist "server\node_modules" (
    echo   Removing server\node_modules...
    rmdir /s /q "server\node_modules"
)
if exist "client\node_modules" (
    echo   Removing client\node_modules...
    rmdir /s /q "client\node_modules"
)
echo.

echo [1/2] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [FAIL] Server dependency installation failed!
    pause
    exit /b 1
)
echo [ OK ] Server dependencies installed
cd ..

echo.
echo [2/2] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo [FAIL] Client dependency installation failed!
    pause
    exit /b 1
)
echo [ OK ] Client dependencies installed
cd ..

echo.
echo ============================================
echo   [ OK ] All dependencies installed!
echo.
echo   Start development:
echo     Terminal 1: cd server ^&^& npm run dev
echo     Terminal 2: cd client ^&^& npm run dev
echo.
echo   Then open http://localhost:5173
echo ============================================
pause

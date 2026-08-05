@echo off
setlocal
echo ======================================================
echo   MarketPro AI - Master Launcher
echo ======================================================

echo.
echo Stopping existing processes to clear ports...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo ======================================================
echo   CHOOSE YOUR ENVIRONMENT:
echo   1) Windows Browser (localhost:5173)
echo   2) Android Studio (Emulator 10.0.2.2)
echo ======================================================
set /p choice="Enter choice (1 or 2): "

set FRONTEND_CMD=npm run dev
if "%choice%"=="2" (
    set FRONTEND_CMD=npm run dev:android
    echo Configured for Android Emulator...
) else (
    echo Configured for Windows Browser...
)

echo.
echo LAUNCHING BACKEND (Port 5001)...
set PYTHONPATH=%CD%\asset_management
start "MARKETPRO BACKEND (Port 5001)" cmd /k "echo Starting Backend... && venv\Scripts\python.exe app.py"

echo.
echo LAUNCHING FRONTEND (Port 5173)...
start "MARKETPRO FRONTEND (Port 5173)" cmd /k "echo Starting Frontend... && cd asset_management\frontend && %FRONTEND_CMD%"

echo.
echo Waiting 12 seconds for system synchronization...
timeout /t 12 /nobreak

if "%choice%"=="1" (
    echo.
    echo SYSTEM READY! Launching your dashboard...
    start http://localhost:5173
)

echo.
echo ======================================================
if "%choice%"=="1" (
    echo   MASTER URL: http://localhost:5173
) else (
    echo   ANDROID URL: (Access via Emulator)
    echo   BACKEND IP: 10.0.2.2 (Internal Emulator Path)
)
echo   BACKEND:    http://localhost:5001/api/health
echo.
echo   KEEP THE OTHER TWO WINDOWS OPEN WHILE WORKING!
echo ======================================================
echo.
pause

@echo off
echo ========================================
echo Starting InterviewAI Development Servers
echo ========================================
echo.

REM Check if virtual environment exists
if not exist venv\Scripts\activate.bat (
    echo ERROR: Virtual environment not found!
    echo Please run setup.bat first
    pause
    exit /b 1
)

echo Starting Python API server in new window...
start "Python API Server" cmd /k "venv\Scripts\activate && python start_api.py"

timeout /t 3 /nobreak > nul

echo Starting Next.js dev server in new window...
start "Next.js Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo Development servers are starting...
echo ========================================
echo.
echo Python API: http://localhost:8000
echo API Docs:   http://localhost:8000/docs
echo Frontend:   http://localhost:3000
echo.
echo Press any key to stop all servers...
pause > nul

echo Stopping servers...
taskkill /FI "WindowTitle eq Python API Server*" /T /F 2>nul
taskkill /FI "WindowTitle eq Next.js Dev Server*" /T /F 2>nul
echo Servers stopped.

@echo off
REM Start Unified Models API Server
REM This server provides endpoints for both gesture and smile analysis

echo ========================================
echo Unified Models API Server
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11+ and add it to PATH
    pause
    exit /b 1
)

echo Python found!
echo.

REM Check if required packages are installed
echo Checking dependencies...
python -c "import fastapi, uvicorn" >nul 2>&1
if errorlevel 1 (
    echo WARNING: FastAPI or Uvicorn not found
    echo Installing required packages...
    pip install fastapi uvicorn python-multipart
    echo.
)

echo Starting server...
echo.
echo Server will be available at:
echo   - API: http://localhost:8000
echo   - Docs: http://localhost:8000/docs
echo   - Health: http://localhost:8000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

python unified_models_api.py

pause


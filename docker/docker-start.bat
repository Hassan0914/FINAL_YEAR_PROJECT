@echo off
cd /d %~dp0
echo ========================================
echo   Docker Quick Start - FYP Project
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/3] Building and starting all services...
echo This may take 5-10 minutes on first run...
echo.

docker-compose -f docker-compose.yml up --build -d

if errorlevel 1 (
    echo [ERROR] Failed to start containers!
    pause
    exit /b 1
)

echo.
echo [2/3] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo [3/3] Running database migrations...
docker-compose -f docker-compose.yml exec -T frontend npx prisma migrate deploy

echo.
echo ========================================
echo   Services are starting!
echo ========================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:8000
echo API Docs:  http://localhost:8000/docs
echo.
echo To view logs: docker-compose logs -f
echo To stop:     docker-compose down
echo.
pause


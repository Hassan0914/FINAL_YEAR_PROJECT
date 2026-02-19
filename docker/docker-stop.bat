@echo off
cd /d %~dp0
echo Stopping all Docker containers...
docker-compose -f docker-compose.yml down
echo.
echo Done! All services stopped.
pause


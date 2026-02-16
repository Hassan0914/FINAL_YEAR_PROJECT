@echo off
echo ========================================
echo PostgreSQL Password Reset Helper
echo ========================================
echo.
echo This script will help you reset your PostgreSQL password.
echo.
echo Step 1: Finding PostgreSQL installation...
echo.

REM Try to find PostgreSQL bin directory
set PG_PATH_17="C:\Program Files\PostgreSQL\17\bin"
set PG_PATH_18="C:\Program Files\PostgreSQL\18\bin"

if exist %PG_PATH_17%\psql.exe (
    echo Found PostgreSQL 17 at: %PG_PATH_17%
    set PG_PATH=%PG_PATH_17%
    goto :found
)

if exist %PG_PATH_18%\psql.exe (
    echo Found PostgreSQL 18 at: %PG_PATH_18%
    set PG_PATH=%PG_PATH_18%
    goto :found
)

echo PostgreSQL not found in default locations.
echo Please open pgAdmin 4 manually to reset the password.
echo.
echo Instructions:
echo 1. Open pgAdmin 4 from Start menu
echo 2. Connect to your PostgreSQL server
echo 3. Right-click server → Properties → Connection tab
echo 4. Note or set the password
echo 5. Update .env.local with the password
echo.
pause
exit /b

:found
echo.
echo PostgreSQL found!
echo.
echo Option 1: Try to connect (might prompt for password)
echo Option 2: Open pgAdmin 4 to reset password
echo.
echo Choose an option:
echo 1. Try connecting to PostgreSQL
echo 2. Open pgAdmin 4
echo 3. Exit
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Attempting to connect to PostgreSQL...
    echo If it asks for a password, try: postgres, admin, 12345, or leave blank
    echo.
    cd /d %PG_PATH%
    psql -U postgres -d postgres
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo Opening pgAdmin 4...
    start "" "C:\Program Files\pgAdmin 4\runtime\pgAdmin4.exe"
    echo.
    echo After opening pgAdmin:
    echo 1. Connect to your PostgreSQL server
    echo 2. Right-click server → Properties → Connection tab
    echo 3. Note or set the password
    echo 4. Update .env.local with: DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/fyp_database"
    echo.
    goto :end
)

:end
echo.
echo After you have the password, update .env.local and run:
echo   node test-db-connection.js
echo.
pause






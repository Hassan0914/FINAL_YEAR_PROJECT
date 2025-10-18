@echo off
echo ========================================
echo InterviewAI Project Setup
echo ========================================
echo.

REM Step 1: Create Python virtual environment
echo [1/6] Creating Python virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    echo Please ensure Python is in your PATH
    pause
    exit /b 1
)

REM Step 2: Activate virtual environment and install Python dependencies
echo [2/6] Installing Python dependencies...
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

REM Step 3: Install Node.js dependencies
echo [3/6] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)

REM Step 4: Check if .env.local exists
echo [4/6] Checking environment configuration...
if not exist .env.local (
    echo Creating .env.local from .env...
    copy .env .env.local
)

REM Step 5: Generate Prisma Client
echo [5/6] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo WARNING: Prisma generate failed - you may need to set up the database first
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Set up PostgreSQL database:
echo    - Open pgAdmin or psql
echo    - Create database: fyp_database
echo    - Update DATABASE_URL in .env.local if needed
echo.
echo 2. Run database migrations:
echo    npx prisma migrate dev --name init
echo.
echo 3. Start the Python API server:
echo    venv\Scripts\activate
echo    python start_api.py
echo.
echo 4. In a new terminal, start Next.js dev server:
echo    npm run dev
echo.
echo 5. Open http://localhost:3000 in your browser
echo.
pause

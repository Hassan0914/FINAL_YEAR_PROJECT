# Quick Start Guide

## Prerequisites

Before running setup, ensure you have:

1. **Python 3.11** - Installed and added to PATH
   - Check: Open new terminal and run `python --version`
   - If not working, follow Python PATH setup in main guide

2. **Node.js 22+** - ✅ Already installed
   - Version: v22.17.1

3. **PostgreSQL 15+** - Must be installed
   - Download: https://www.postgresql.org/download/windows/
   - Remember the postgres password you set!

## Setup Steps

### 1. Run Automated Setup

Open terminal in project directory and run:

```bash
setup.bat
```

This will:
- Create Python virtual environment
- Install all Python dependencies
- Install all Node.js dependencies
- Set up environment configuration
- Generate Prisma client

### 2. Set Up Database

After setup.bat completes:

1. **Open pgAdmin 4** or use command line psql
2. **Create the database:**
   ```sql
   CREATE DATABASE fyp_database;
   CREATE USER fyp_user WITH PASSWORD 'ABCDEFGHIJ';
   GRANT ALL PRIVILEGES ON DATABASE fyp_database TO fyp_user;
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

### 3. Start Development Servers

Run both servers with one command:

```bash
start_dev.bat
```

Or manually:

**Terminal 1 - Python API:**
```bash
venv\Scripts\activate
python start_api.py
```

**Terminal 2 - Next.js:**
```bash
npm run dev
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Python API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Troubleshooting

### Python not found
- Add Python to PATH (see main setup guide)
- Restart terminal after adding to PATH

### PostgreSQL connection error
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env.local`
- Test connection with pgAdmin

### Port already in use
- Python API (8000): Stop other processes using this port
- Next.js (3000): Stop other dev servers

### Prisma errors
- Run: `npx prisma generate`
- Check database is created
- Verify DATABASE_URL format

## Project Structure

```
├── app/                    # Next.js frontend
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   └── upload/            # Video upload page
├── components/            # React components
├── gesture_analysis_api/  # Gesture analysis backend
├── voice_confidence_production/  # Voice analysis
├── prisma/               # Database schema
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
└── start_api.py         # Python API startup script
```

## Common Tasks

### Reset Database
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Update Dependencies
```bash
# Python
venv\Scripts\activate
pip install -r requirements.txt --upgrade

# Node.js
npm update
```

### View Database
```bash
npx prisma studio
```

## Need Help?

Check the detailed guides:
- `SETUP_INSTRUCTIONS.md` - Gesture API integration
- `AUTHENTICATION_SETUP.md` - Auth system details
- `gesture_analysis_api/README.md` - API documentation

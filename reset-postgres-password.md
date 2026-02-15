# Reset PostgreSQL Password - Step by Step Guide

## Method 1: Using pgAdmin 4 (Easiest)

1. **Open pgAdmin 4** (search for it in Windows Start menu)
2. **Connect to your server**:
   - If it asks for a password, try common passwords like:
     - `postgres`
     - `admin`
     - `12345`
     - `password`
     - (or leave blank if it allows)
3. **Once connected**:
   - Right-click on your PostgreSQL server (usually "PostgreSQL 17" or "PostgreSQL 18")
   - Select **Properties**
   - Go to **Connection** tab
   - You'll see the current password (or can set a new one)
4. **Note the password** and update `.env.local`

## Method 2: Reset via Command Line (If you have access)

If you can access PostgreSQL via command line, you can reset it:

1. Open Command Prompt or PowerShell as Administrator
2. Navigate to PostgreSQL bin folder (usually):
   ```
   cd "C:\Program Files\PostgreSQL\17\bin"
   ```
   (or `18` if that's your version)
3. Connect without password (if possible):
   ```
   psql -U postgres
   ```
4. If that works, reset password:
   ```sql
   ALTER USER postgres WITH PASSWORD 'newpassword123';
   ```
5. Update `.env.local` with the new password

## Method 3: Create a New User (Alternative)

If you can't reset the postgres user, create a new user:

1. Open pgAdmin or psql
2. Run:
   ```sql
   CREATE USER fyp_user WITH PASSWORD 'mypassword123';
   CREATE DATABASE fyp_database;
   GRANT ALL PRIVILEGES ON DATABASE fyp_database TO fyp_user;
   ```
3. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://fyp_user:mypassword123@localhost:5432/fyp_database"
   ```

## Method 4: Check pgpass.conf File

PostgreSQL might have saved the password in a config file:

1. Check: `C:\Users\hp\AppData\Roaming\postgresql\pgpass.conf`
2. Or: `%APPDATA%\postgresql\pgpass.conf`
3. This file might contain the saved password

## Quick Test After Fixing

After updating the password in `.env.local`, test it:
```bash
node test-db-connection.js
```

If successful, you'll see: ✅ Database connection successful!






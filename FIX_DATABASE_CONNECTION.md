# Fix Database Connection Issue

## Problem
The error "Database authentication failed" means your PostgreSQL password in `.env.local` doesn't match your actual PostgreSQL password.

## Solution

### Step 1: Find Your PostgreSQL Password

**Option A: Check if you remember it**
- What password did you set when installing PostgreSQL?

**Option B: Reset PostgreSQL Password**
1. Open **pgAdmin 4** (or use command line)
2. Right-click on your PostgreSQL server → Properties
3. Go to Connection tab
4. Update the password, or note the current password

**Option C: Use Windows Authentication**
If you're on Windows and PostgreSQL is set up for Windows authentication, you might need to use a different connection string.

### Step 2: Update .env.local

Open `.env.local` and update the DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/fyp_database"
```

Replace `YOUR_ACTUAL_PASSWORD` with your actual PostgreSQL password.

### Step 3: Test the Connection

Run this command to test:
```bash
node test-db-connection.js
```

If it shows "✅ Database connection successful!", you're good to go!

### Step 4: Ensure Database Exists

Make sure the database `fyp_database` exists. If not, create it:

```sql
CREATE DATABASE fyp_database;
```

### Step 5: Run Migrations

After fixing the connection, run:
```bash
npx prisma migrate dev
```

## Common Issues

1. **Password has special characters**: URL-encode them (e.g., `@` becomes `%40`)
2. **Database doesn't exist**: Create it using pgAdmin or psql
3. **PostgreSQL not running**: Start PostgreSQL service from Services (Windows)

## Quick Test

After updating `.env.local`, restart your dev server and try signing up again.














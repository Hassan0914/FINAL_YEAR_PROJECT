-- Setup script to create friend's database user
-- Run this in pgAdmin 4 or psql

-- Create the user with friend's password
CREATE USER fyp_user WITH PASSWORD 'ABCDEFGHIJ';

-- Grant privileges on the database
GRANT ALL PRIVILEGES ON DATABASE fyp_database TO fyp_user;

-- If tables already exist, grant privileges on them
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fyp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fyp_user;

-- Verify the user was created
SELECT usename FROM pg_user WHERE usename = 'fyp_user';


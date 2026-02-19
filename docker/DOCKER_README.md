# Docker Setup Guide

This guide will help you dockerize and run the entire project using Docker Compose.

## Prerequisites

- Docker Desktop installed (or Docker Engine + Docker Compose)
- At least 4GB RAM available
- 10GB free disk space

## Quick Start

### 1. Build and Start All Services

```bash
docker-compose up --build
```

This will:
- Build frontend (Next.js)
- Build backend (Python FastAPI)
- Start PostgreSQL database
- Run all services together

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

### 3. Stop All Services

```bash
docker-compose down
```

### 4. Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

## Environment Variables

Create a `.env` file in the project root with:

```env
# Database
DATABASE_URL=postgresql://postgres:12345@postgres:5432/fyp_database

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
JWT_SECRET=your-jwt-secret-change-this-in-production

# Backend API
UNIFIED_API_URL=http://backend:8000

# Email (for verification)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Note**: The `.env` file is already in `.dockerignore` and won't be copied to containers. Use `docker-compose.yml` environment variables or `.env` file for local development.

## First Time Setup

### 1. Run Database Migrations

After starting the containers, run Prisma migrations:

```bash
# Option 1: From host machine
docker-compose exec frontend npx prisma migrate deploy

# Option 2: Already included in docker-compose.yml command
# Migrations run automatically on frontend startup
```

### 2. Generate Prisma Client (if needed)

```bash
docker-compose exec frontend npx prisma generate
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build frontend
docker-compose build backend

# Rebuild and restart
docker-compose up --build frontend
```

### Access Container Shell

```bash
# Frontend container
docker-compose exec frontend sh

# Backend container
docker-compose exec backend bash

# Database container
docker-compose exec postgres psql -U postgres -d fyp_database
```

### Check Container Status

```bash
docker-compose ps
```

## Troubleshooting

### Port Already in Use

If ports 3000, 8000, or 5432 are already in use:

1. Stop the conflicting service, or
2. Change ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Frontend on 3001
     - "8001:8000"  # Backend on 8001
     - "5433:5432"  # Database on 5433
   ```

### Database Connection Issues

1. Check if postgres container is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify DATABASE_URL in docker-compose.yml matches postgres service name

### Frontend Build Fails

1. Clear Next.js cache:
   ```bash
   docker-compose exec frontend rm -rf .next
   ```

2. Rebuild:
   ```bash
   docker-compose build --no-cache frontend
   ```

### Backend Model Loading Issues

1. Verify model files exist:
   ```bash
   docker-compose exec backend ls -la Models/gesture\ analysis\ model/
   ```

2. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

### Out of Memory

If containers crash due to memory:

1. Increase Docker Desktop memory limit (Settings → Resources)
2. Or reduce model loading (comment out smile model if needed)

## Production Deployment

For production:

1. **Update environment variables** in `docker-compose.yml`:
   - Use strong secrets for `NEXTAUTH_SECRET` and `JWT_SECRET`
   - Update `NEXTAUTH_URL` to your domain
   - Use production database credentials

2. **Use environment file**:
   ```bash
   docker-compose --env-file .env.production up -d
   ```

3. **Enable HTTPS** (use reverse proxy like Nginx or Traefik)

4. **Set resource limits** in `docker-compose.yml`:
   ```yaml
   services:
     frontend:
       deploy:
         resources:
           limits:
             memory: 2G
             cpus: '1'
   ```

## File Structure

```
.
├── Dockerfile.frontend      # Frontend container
├── Dockerfile.backend       # Backend container
├── docker-compose.yml       # Orchestration
├── .dockerignore            # Files to exclude
└── DOCKER_README.md        # This file
```

## Notes

- Model files are mounted as volumes, so they persist
- Uploads directory is mounted for file persistence
- Database data persists in `postgres_data` volume
- Frontend uses standalone output for smaller image size
- Backend includes all ML dependencies (TensorFlow, MediaPipe, etc.)

## Support

If you encounter issues:
1. Check container logs: `docker-compose logs`
2. Verify all services are running: `docker-compose ps`
3. Check Docker resources: Docker Desktop → Settings → Resources


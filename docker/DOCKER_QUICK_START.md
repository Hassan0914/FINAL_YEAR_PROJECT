# 🐳 Docker Quick Start Guide

**Fastest way to run your entire project!**

## ⚡ Quick Start (3 Steps)

### Step 1: Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Make sure it's running (green icon in system tray)

### Step 2: Set Environment Variables
Create a `.env` file in the project root (or use the existing one):

```env
# Database (already configured in docker-compose.yml)
DATABASE_URL=postgresql://postgres:12345@postgres:5432/fyp_database

# NextAuth (IMPORTANT: Change these in production!)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
JWT_SECRET=your-jwt-secret-change-this-in-production

# Backend API
UNIFIED_API_URL=http://backend:8000

# Email (for verification)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Step 3: Run Everything!

**Option A: Use the batch script (Windows)**
```bash
docker-start.bat
```

**Option B: Use Docker Compose directly**
```bash
docker-compose up --build
```

That's it! 🎉

## 📍 Access Your Services

Once running, access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432 (user: postgres, password: 12345)

## 🛑 Stop Everything

**Option A: Use the batch script**
```bash
docker-stop.bat
```

**Option B: Use Docker Compose**
```bash
docker-compose down
```

## 📊 Check Status

```bash
# View all running containers
docker-compose ps

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

## 🔧 Common Commands

### Rebuild After Code Changes
```bash
docker-compose up --build
```

### Restart a Specific Service
```bash
docker-compose restart frontend
docker-compose restart backend
```

### Access Container Shell
```bash
# Frontend
docker-compose exec frontend sh

# Backend
docker-compose exec backend bash

# Database
docker-compose exec postgres psql -U postgres -d fyp_database
```

### Clean Everything (Fresh Start)
```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Then rebuild
docker-compose up --build
```

## ⚠️ Troubleshooting

### Port Already in Use
If ports 3000, 8000, or 5432 are already in use:
1. Stop the conflicting service, OR
2. Edit `docker-compose.yml` and change the port mappings

### Docker Not Running
- Make sure Docker Desktop is running
- Check system tray for Docker icon

### Build Fails
```bash
# Clean build (no cache)
docker-compose build --no-cache

# Then start
docker-compose up
```

### Database Connection Issues
```bash
# Check if postgres is healthy
docker-compose ps postgres

# Check database logs
docker-compose logs postgres
```

### Out of Memory
- Increase Docker Desktop memory limit:
  - Docker Desktop → Settings → Resources → Memory
  - Set to at least 4GB (8GB recommended)

## 📁 What Gets Dockerized?

- ✅ **Frontend** (Next.js) - Port 3000
- ✅ **Backend** (Python FastAPI) - Port 8000
- ✅ **PostgreSQL Database** - Port 5432
- ✅ **All Models** (mounted as volumes)
- ✅ **Uploads Directory** (persistent storage)

## 🚀 Production Deployment

For production:
1. Update `.env` with production secrets
2. Change `NEXTAUTH_URL` to your domain
3. Use strong passwords for database
4. Enable HTTPS (use reverse proxy like Nginx)

## 📝 Notes

- First build takes 5-10 minutes (downloading dependencies)
- Subsequent builds are much faster (cached layers)
- Database data persists in Docker volume
- Model files are mounted from your local directory
- Uploads are stored in `./uploads` directory

---

**That's it! Your entire project is now containerized and ready to run with one command!** 🎉


# Run Unified API and Test Commands

## 🚀 Quick Start Commands

### 1. Start the Unified API Server

**Windows:**
```cmd
start_unified_api.bat
```

**Manual:**
```cmd
python unified_models_api.py
```

The API will start on: **http://localhost:8000**

---

### 2. Start the Next.js Frontend

**In a new terminal:**
```cmd
npm run dev
```

The frontend will start on: **http://localhost:3000**

---

## 🧪 Testing the API

### Test 1: Health Check
```cmd
curl http://localhost:8000/api/health
```

Or open in browser: http://localhost:8000/api/health

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-14T...",
  "models": {
    "gesture": { "loaded": true, ... },
    "smile": { "loaded": true, ... }
  }
}
```

---

### Test 2: Analyze Video (Postman or curl)

**Using curl:**
```cmd
curl -X POST http://localhost:8000/api/analyze-all -F "file=@path/to/your/video.mp4"
```

**Using Postman:**
1. Method: `POST`
2. URL: `http://localhost:8000/api/analyze-all`
3. Body → form-data
4. Key: `file` (type: File)
5. Select video file
6. Send

**Expected Response:**
```json
{
  "success": true,
  "video_name": "video.mp4",
  "gesture_analysis": {
    "success": true,
    "scores": { ... },
    "frames_processed": 961
  },
  "smile_analysis": {
    "success": true,
    "smile_score": 4.34,
    "interpretation": "Moderate - Average engagement"
  },
  "total_processing_time_seconds": 69.73
}
```

---

### Test 3: Test Frontend Integration

1. Open browser: http://localhost:3000
2. Click "Try Demo" or "Upload Interview Video"
3. Upload a video file
4. Click "Analyze Video"
5. Wait for analysis (may take 30-120 seconds)
6. View results showing both gesture and smile analysis

---

## ✅ Verification Checklist

- [ ] Unified API server is running (port 8000)
- [ ] Health check shows both models loaded
- [ ] Next.js frontend is running (port 3000)
- [ ] Can upload video through frontend
- [ ] Analysis completes successfully
- [ ] Both gesture and smile results are displayed
- [ ] No errors in browser console
- [ ] No errors in API server logs

---

## 🔧 Troubleshooting

### API not starting
- Check Python is installed: `python --version`
- Install dependencies: `pip install -r unified_api_requirements.txt`
- Check port 8000 is not in use

### Models not loading
- Verify model files exist:
  - `Models/gesture analysis model/gesture_model.h5`
  - `Models/smile model/smile_model.joblib`
- Check server logs for error messages

### Frontend can't connect to API
- Verify API is running on port 8000
- Check `UNIFIED_API_URL` in `.env.local` (defaults to http://localhost:8000)
- Check CORS settings in unified_models_api.py

### Analysis timeout
- Videos should be 10-60 seconds for faster processing
- Check server has enough memory
- Increase timeout in `app/api/analyze-video/route.ts` if needed

---

## 📊 Expected Processing Times

- **Short video (10-30s)**: 20-40 seconds
- **Medium video (30-60s)**: 40-80 seconds  
- **Long video (60s+)**: 80-120+ seconds

Processing time depends on:
- Video length
- Number of frames
- CPU performance
- Model complexity

---

## 🎯 Quick Test Script

**Windows (PowerShell):**
```powershell
# Start API
Start-Process cmd -ArgumentList "/c start_unified_api.bat"

# Wait 5 seconds
Start-Sleep -Seconds 5

# Test health
Invoke-WebRequest -Uri "http://localhost:8000/api/health" | Select-Object -ExpandProperty Content
```

---

## 📝 Environment Variables

Create `.env.local` in project root (optional):
```env
UNIFIED_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:8000`


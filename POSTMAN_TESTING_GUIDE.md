# Postman Testing Guide for Unified Models API

This guide explains how to test the Unified Models API using Postman.

## 🚀 Starting the Server

### Windows:
```cmd
start_unified_api.bat
```

### Manual:
```cmd
python unified_models_api.py
```

Server will start on: **http://localhost:8000**

---

## 📋 API Endpoints

### 1. Health Check
**GET** `http://localhost:8000/api/health`

**No body required**

**Expected Response:**
```json
{
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00",
    "models": {
        "gesture": {
            "loaded": true,
            "path": "E:\\FYP1\\FINAL_YEAR_PROJECT\\Models\\gesture analysis model"
        },
        "smile": {
            "loaded": true,
            "path": "E:\\FYP1\\FINAL_YEAR_PROJECT\\Models\\smile model"
        }
    }
}
```

---

### 2. Gesture Analysis
**POST** `http://localhost:8000/api/analyze-gesture`

**Request Setup:**
1. Method: `POST`
2. URL: `http://localhost:8000/api/analyze-gesture`
3. Body tab → Select `form-data`
4. Add key: `file` (type: File)
5. Click "Select Files" and choose a video file (MP4, AVI, MOV, etc.)

**Expected Response:**
```json
{
    "success": true,
    "model": "gesture",
    "video_name": "interview.mp4",
    "scores": {
        "self_touch": 2.5,
        "hands_on_table": 3.2,
        "hidden_hands": 1.1,
        "gestures_on_table": 4.8,
        "other_gestures": 5.3
    },
    "processing_time_seconds": 12.5,
    "frames_processed": 1500,
    "total_predictions": 45
}
```

**Scores Explanation:**
- All scores are on a scale of 1-7
- Higher score = more of that gesture type detected
- `self_touch`: Touching face, hair, or torso
- `hands_on_table`: Hands resting on table
- `hidden_hands`: No hands visible
- `gestures_on_table`: Gesturing while hands close to table
- `other_gestures`: Gesturing while hands not close to table

---

### 3. Smile/Facial Analysis
**POST** `http://localhost:8000/api/analyze-smile`

**Request Setup:**
1. Method: `POST`
2. URL: `http://localhost:8000/api/analyze-smile`
3. Body tab → Select `form-data`
4. Add key: `file` (type: File)
5. Click "Select Files" and choose a video file

**Expected Response:**
```json
{
    "success": true,
    "model": "smile",
    "video_name": "interview.mp4",
    "smile_score": 5.42,
    "interpretation": "High - Good positive expressions",
    "frames_processed": 300,
    "video_duration_seconds": 30.0,
    "processing_time_seconds": 8.5
}
```

**Score Interpretation:**
- **6.0-7.0**: Very High - Excellent positive engagement
- **5.0-5.9**: High - Good positive expressions
- **4.0-4.9**: Moderate - Average engagement
- **3.0-3.9**: Low - Limited positive expressions
- **1.0-2.9**: Very Low - Minimal smiling

---

### 4. Combined Analysis (Both Models)
**POST** `http://localhost:8000/api/analyze-all`

**Request Setup:**
1. Method: `POST`
2. URL: `http://localhost:8000/api/analyze-all`
3. Body tab → Select `form-data`
4. Add key: `file` (type: File)
5. Click "Select Files" and choose a video file

**Expected Response:**
```json
{
    "success": true,
    "video_name": "interview.mp4",
    "gesture_analysis": {
        "success": true,
        "model": "gesture",
        "scores": { ... },
        "processing_time_seconds": 12.5
    },
    "smile_analysis": {
        "success": true,
        "model": "smile",
        "smile_score": 5.42,
        "interpretation": "High - Good positive expressions",
        "processing_time_seconds": 8.5
    },
    "total_processing_time_seconds": 21.0
}
```

---

## 📸 Postman Setup Screenshots Guide

### Step 1: Create New Request
1. Click "New" → "HTTP Request"
2. Name it (e.g., "Gesture Analysis")

### Step 2: Set Method and URL
1. Select `POST` from dropdown
2. Enter URL: `http://localhost:8000/api/analyze-gesture`

### Step 3: Configure Body
1. Click "Body" tab
2. Select `form-data` radio button
3. In the key field, type: `file`
4. Hover over the key field → dropdown appears → select `File`
5. Click "Select Files" button
6. Choose your video file

### Step 4: Send Request
1. Click "Send" button
2. Wait for response (may take 10-30 seconds depending on video length)

---

## 🧪 Testing Checklist

### Before Testing:
- [ ] Server is running (`start_unified_api.bat`)
- [ ] Health check returns both models loaded
- [ ] You have a test video file ready

### Test Gesture Analysis:
- [ ] Health check works
- [ ] Gesture analysis endpoint accepts video
- [ ] Response contains all 5 gesture scores
- [ ] Scores are between 1-7
- [ ] Processing time is reasonable

### Test Smile Analysis:
- [ ] Smile analysis endpoint accepts video
- [ ] Response contains smile_score
- [ ] Score is between 1-7
- [ ] Interpretation text is present

### Test Combined Analysis:
- [ ] Combined endpoint works
- [ ] Both analyses are included in response
- [ ] Total processing time is calculated

---

## ⚠️ Common Issues

### Error: "Gesture model not loaded"
**Solution:**
- Check that `Models/gesture analysis model/gesture_model.h5` exists
- Check server logs for loading errors
- Ensure all dependencies are installed

### Error: "Smile model not loaded"
**Solution:**
- Check that `Models/smile model/smile_model.joblib` exists
- Check server logs for loading errors
- Ensure all dependencies are installed

### Error: "Invalid file type"
**Solution:**
- Ensure you're sending a video file (MP4, AVI, MOV, WebM)
- Check Content-Type header in Postman

### Error: "No landmarks extracted"
**Solution:**
- Video must show a person with visible hands
- Ensure good lighting and clear video quality
- Try a different video file

### Error: "Video too short or no faces detected"
**Solution:**
- Video must be at least 1-2 seconds long
- Ensure face is clearly visible in video
- Try a different video file

### Request Timeout
**Solution:**
- Video processing can take 10-60 seconds depending on length
- Increase Postman timeout: Settings → General → Request timeout (set to 120000ms)
- Or use a shorter test video

---

## 📊 Example Test Videos

Good test videos should have:
- ✅ Person clearly visible
- ✅ Hands visible (for gesture analysis)
- ✅ Face clearly visible (for smile analysis)
- ✅ Good lighting
- ✅ 10-60 seconds duration
- ✅ MP4, AVI, or MOV format

---

## 🔍 API Documentation

Interactive API documentation (Swagger UI) is available at:
**http://localhost:8000/docs**

This provides:
- All available endpoints
- Request/response schemas
- Try it out functionality
- Example requests

---

## 📝 Response Format Reference

### Success Response:
```json
{
    "success": true,
    "model": "gesture" | "smile",
    "video_name": "string",
    ...
}
```

### Error Response:
```json
{
    "detail": "Error message here"
}
```

HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (invalid file, missing data)
- `500`: Internal Server Error (processing failed)
- `503`: Service Unavailable (model not loaded)

---

## 🚀 Quick Start Commands

**Start Server:**
```cmd
start_unified_api.bat
```

**Test Health:**
```
GET http://localhost:8000/api/health
```

**Test Gesture:**
```
POST http://localhost:8000/api/analyze-gesture
Body: form-data, key: file, value: [your video file]
```

**Test Smile:**
```
POST http://localhost:8000/api/analyze-smile
Body: form-data, key: file, value: [your video file]
```

**Test Both:**
```
POST http://localhost:8000/api/analyze-all
Body: form-data, key: file, value: [your video file]
```

---

## 💡 Tips

1. **Start with Health Check**: Always test `/api/health` first to ensure models are loaded
2. **Use Short Videos**: For testing, use 10-30 second videos for faster results
3. **Check Server Logs**: The console output shows detailed processing information
4. **Save Requests**: Save your Postman requests as a collection for easy reuse
5. **Test One at a Time**: Test gesture and smile separately before using combined endpoint

---

Happy Testing! 🎉


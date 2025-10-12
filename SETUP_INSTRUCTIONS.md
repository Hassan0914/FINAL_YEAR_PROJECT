# Gesture Prediction API Integration

This guide will help you set up the gesture prediction API with your Next.js frontend application.

## 🎯 Overview

The integration includes:
- **Python API Server**: FastAPI server that processes videos and predicts gesture scores
- **Next.js API Routes**: Bridge between frontend and Python backend
- **Updated Frontend**: Video analysis modal with real gesture prediction

## 📁 Files Added/Modified

### New Files:
- `api_server.py` - Python FastAPI server
- `requirements.txt` - Python dependencies
- `start_api.py` - Startup script for Python server
- `app/api/gesture-prediction/route.ts` - Next.js API route
- `app/api/gesture-descriptions/route.ts` - Gesture descriptions API route

### Modified Files:
- `components/video-analysis-modal.tsx` - Updated with real API integration

## 🚀 Setup Instructions

### Step 1: Install Python Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# Or install individually:
pip install fastapi uvicorn opencv-python mediapipe pandas numpy scikit-learn joblib python-multipart
```

### Step 2: Verify Model Files

Ensure these files are in the `final_trained_models/` directory:
- `hidden_hands_score_model.joblib`
- `hands_on_table_score_model.joblib`
- `gestures_on_table_score_model.joblib`
- `other_gestures_score_model.joblib`
- `self_touch_score_model.joblib`

### Step 3: Start the Python API Server

**Option A: Using the startup script (Recommended)**
```bash
python start_api.py
```

**Option B: Manual start**
```bash
python api_server.py
```

The Python API will be available at:
- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Step 4: Start the Next.js Application

In a **separate terminal**:
```bash
npm run dev
```

The frontend will be available at:
- **Frontend**: http://localhost:3000

## 🔧 API Endpoints

### Python API Endpoints (FastAPI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health check |
| `/predict-gestures` | POST | Upload video and get gesture scores |
| `/predict-from-landmarks` | POST | Predict from pre-extracted landmarks |
| `/gesture-descriptions` | GET | Get gesture type descriptions |

### Next.js API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gesture-prediction` | POST | Upload video for analysis |
| `/api/gesture-descriptions` | GET | Get gesture descriptions |

## 📊 Gesture Scores

The API returns scores (1-7 scale) for these gesture types:

1. **hidden_hands** - No hands visible in the image
2. **hands_on_table** - Hands resting on table
3. **gestures_on_table** - Gesturing while hands close to table
4. **other_gestures** - Gesturing while hands not close to table
5. **self_touch** - Touching face, hair, or torso

## 🎬 How to Test

1. **Start both servers** (Python API + Next.js)
2. **Open** http://localhost:3000
3. **Click** "Try Demo" or "Upload Interview Video"
4. **Upload** a video file (MP4, MOV, AVI)
5. **Click** "Analyze Gestures"
6. **View** the gesture analysis results

## 🔍 Troubleshooting

### Python API Issues

**Error: "No module named 'fastapi'"**
```bash
pip install fastapi uvicorn
```

**Error: "Model files not found"**
- Ensure all `.joblib` files are in `final_trained_models/` directory
- Check file names match exactly

**Error: "MediaPipe not working"**
```bash
pip install mediapipe opencv-python
```

### Next.js API Issues

**Error: "Python API is not available"**
- Ensure Python API server is running on port 8000
- Check `PYTHON_API_URL` environment variable

**Error: "CORS issues"**
- Python API includes CORS middleware for localhost:3000
- Check if both servers are running

### Video Processing Issues

**Error: "No landmarks detected"**
- Ensure video shows hands clearly
- Try a different video with better lighting
- Check video format (MP4, MOV, AVI supported)

**Error: "Video too large"**
- Limit video size to under 100MB
- Consider compressing the video

## 🛠️ Development

### Environment Variables

Create a `.env.local` file in your Next.js project:
```env
PYTHON_API_URL=http://localhost:8000
```

### Customizing the API

**Modify gesture scoring logic** in `api_server.py`:
```python
# In predict_gesture_scores method
score = max(1, min(7, int(pred)))  # Current: clamp to 1-7
```

**Add new gesture types** in `correct_feature_engineering.py`:
```python
# Add new features in extract_hand_features method
```

**Update frontend display** in `components/video-analysis-modal.tsx`:
```typescript
// Modify getInsights function for custom analysis
```

## 📈 Performance Notes

- **Video processing**: ~2-5 seconds per 10-second video
- **Model loading**: ~1-2 seconds on startup
- **Memory usage**: ~200-500MB for Python API
- **Supported formats**: MP4, MOV, AVI, WebM

## 🔒 Security Notes

- API runs on localhost only (not exposed to internet)
- File uploads are temporarily stored and cleaned up
- No persistent storage of uploaded videos
- CORS configured for localhost:3000 only

## 📞 Support

If you encounter issues:

1. **Check logs** in both terminal windows
2. **Verify** all dependencies are installed
3. **Ensure** model files are present
4. **Test** Python API directly at http://localhost:8000/docs
5. **Check** browser console for frontend errors

## 🎉 Success!

Once everything is running, you should be able to:
- Upload videos through the web interface
- See real-time gesture analysis
- View detailed gesture scores (1-7 scale)
- Get AI-powered insights and recommendations

The integration is now complete! 🚀



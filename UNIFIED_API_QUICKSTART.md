# Unified Models API - Quick Start Guide

## 🚀 Quick Start

### 1. Install Dependencies
```cmd
pip install -r unified_api_requirements.txt
```

### 2. Start the Server
```cmd
start_unified_api.bat
```

Or manually:
```cmd
python unified_models_api.py
```

### 3. Test in Postman

**Health Check:**
- Method: `GET`
- URL: `http://localhost:8000/api/health`

**Gesture Analysis:**
- Method: `POST`
- URL: `http://localhost:8000/api/analyze-gesture`
- Body: `form-data` → key: `file` (type: File) → Select video

**Smile Analysis:**
- Method: `POST`
- URL: `http://localhost:8000/api/analyze-smile`
- Body: `form-data` → key: `file` (type: File) → Select video

**Combined Analysis:**
- Method: `POST`
- URL: `http://localhost:8000/api/analyze-all`
- Body: `form-data` → key: `file` (type: File) → Select video

## 📚 Full Documentation

See `POSTMAN_TESTING_GUIDE.md` for detailed testing instructions.

## 🔍 Interactive API Docs

Visit **http://localhost:8000/docs** for Swagger UI with try-it-out functionality.

## ✅ What's Included

- ✅ Gesture Analysis Model (from `Models/gesture analysis model/`)
- ✅ Smile/Facial Analysis Model (from `Models/smile model/`)
- ✅ Combined analysis endpoint
- ✅ Health check endpoint
- ✅ Automatic model loading
- ✅ Error handling
- ✅ CORS enabled for testing
- ✅ Interactive API documentation

## 🎯 Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/api/health` | GET | Health check & model status |
| `/api/analyze-gesture` | POST | Gesture analysis only |
| `/api/analyze-smile` | POST | Smile analysis only |
| `/api/analyze-all` | POST | Both analyses combined |
| `/docs` | GET | Interactive API documentation |

## ⚠️ Requirements

- Python 3.11+
- Model files:
  - `Models/gesture analysis model/gesture_model.h5`
  - `Models/smile model/smile_model.joblib`
- All dependencies from `unified_api_requirements.txt`


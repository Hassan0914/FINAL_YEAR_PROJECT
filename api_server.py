"""
Smile Score Prediction API Server
Production-ready REST API for video-based smile analysis

Endpoints:
    POST /api/analyze-video     - Upload video and get smile score
    POST /api/analyze-features  - Submit extracted features
    GET  /api/health            - Health check
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
import uuid
import shutil
import numpy as np
import pandas as pd
import joblib
import cv2
from datetime import datetime

# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="Smile Score Prediction API",
    description="Analyze interview videos to predict smile scores using ML",
    version="1.0.0"
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_PATH = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_PATH, "smile_model.joblib")
UPLOAD_DIR = os.path.join(BASE_PATH, "uploads")
RESULTS_DIR = os.path.join(BASE_PATH, "results")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

# Load model at startup
print("Loading ML model...")
artifacts = joblib.load(MODEL_PATH)
model = artifacts['model']
scaler = artifacts['scaler']
feature_cols = artifacts['feature_cols']
print(f"Model loaded. R² Score: {artifacts['r2_score']:.4f}")


# ============================================================
# DATA MODELS
# ============================================================

class AnalysisResult(BaseModel):
    """Response model for smile analysis"""
    request_id: str
    smile_score: float
    confidence: str
    frames_processed: int
    processing_time_ms: int
    timestamp: str
    interpretation: str

class FeatureInput(BaseModel):
    """Input model for pre-extracted features"""
    features: List[List[float]]  # Shape: (n_frames, 5)

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    model_loaded: bool
    r2_score: float


# ============================================================
# FEATURE EXTRACTION (SHORE Integration)
# ============================================================

def extract_features_from_video(video_path: str, sample_rate: int = 3) -> np.ndarray:
    """
    Extract SHORE-like features from video
    
    In production, replace this with actual SHORE SDK integration
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"Cannot open video: {video_path}")
    
    # Load cascades for fallback extraction
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    smile_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_smile.xml'
    )
    
    features_list = []
    frame_idx = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_idx % sample_rate == 0:
            features = np.zeros(5)
            
            try:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                
                if len(faces) > 0:
                    x, y, w, h = faces[0]
                    face_roi = gray[y:y+h, x:x+w]
                    
                    # Feature extraction
                    smiles = smile_cascade.detectMultiScale(face_roi, 1.8, 20)
                    features[0] = min(100, len(smiles) * 25)
                    features[1] = min(100, (w * h) / (frame.shape[0] * frame.shape[1]) * 500)
                    features[2] = w / h * 50
                    features[3] = np.mean(face_roi[int(h*0.2):int(h*0.5), :]) / 2.55
                    features[4] = np.std(face_roi) / 2.55
            except:
                pass
            
            features_list.append(features)
        
        frame_idx += 1
    
    cap.release()
    return np.array(features_list)


def calculate_statistics(data: np.ndarray) -> dict:
    """Calculate comprehensive statistics from frame features"""
    if data.ndim == 1:
        data = data.reshape(-1, 1)
    
    stats = {}
    num_cols = data.shape[1]
    
    for col in range(num_cols):
        col_data = data[:, col]
        prefix = f"attr{col+1}"
        
        # Basic statistics
        stats[f"{prefix}_std"] = np.std(col_data)
        stats[f"{prefix}_mean"] = np.mean(col_data)
        stats[f"{prefix}_min"] = np.min(col_data)
        stats[f"{prefix}_max"] = np.max(col_data)
        stats[f"{prefix}_range"] = np.max(col_data) - np.min(col_data)
        stats[f"{prefix}_median"] = np.median(col_data)
        stats[f"{prefix}_var"] = np.var(col_data)
        stats[f"{prefix}_q25"] = np.percentile(col_data, 25)
        stats[f"{prefix}_q75"] = np.percentile(col_data, 75)
        stats[f"{prefix}_iqr"] = stats[f"{prefix}_q75"] - stats[f"{prefix}_q25"]
        stats[f"{prefix}_skew"] = pd.Series(col_data).skew()
        stats[f"{prefix}_kurt"] = pd.Series(col_data).kurtosis()
        
        # Additional percentiles
        stats[f"{prefix}_q10"] = np.percentile(col_data, 10)
        stats[f"{prefix}_q90"] = np.percentile(col_data, 90)
        stats[f"{prefix}_q05"] = np.percentile(col_data, 5)
        stats[f"{prefix}_q95"] = np.percentile(col_data, 95)
        
        # Time-series features
        stats[f"{prefix}_rms"] = np.sqrt(np.mean(col_data**2))
        stats[f"{prefix}_energy"] = np.sum(col_data**2)
        stats[f"{prefix}_entropy"] = -np.sum(
            np.abs(col_data/np.sum(np.abs(col_data)+1e-10)) * 
            np.log(np.abs(col_data/np.sum(np.abs(col_data)+1e-10))+1e-10)
        )
        
        # Rate of change
        diff = np.diff(col_data)
        stats[f"{prefix}_diff_mean"] = np.mean(diff) if len(diff) > 0 else 0
        stats[f"{prefix}_diff_std"] = np.std(diff) if len(diff) > 0 else 0
        stats[f"{prefix}_diff_max"] = np.max(np.abs(diff)) if len(diff) > 0 else 0
        
        # Signal features
        stats[f"{prefix}_zero_cross"] = np.sum(np.diff(np.signbit(col_data - np.mean(col_data))))
        
        peaks = sum(1 for i in range(1, len(col_data)-1) 
                   if col_data[i] > col_data[i-1] and col_data[i] > col_data[i+1])
        stats[f"{prefix}_peaks"] = peaks
        
        if len(col_data) > 1:
            autocorr = np.corrcoef(col_data[:-1], col_data[1:])[0, 1]
            stats[f"{prefix}_autocorr"] = autocorr if not np.isnan(autocorr) else 0
        else:
            stats[f"{prefix}_autocorr"] = 0
        
        stats[f"{prefix}_cv"] = stats[f"{prefix}_std"] / (stats[f"{prefix}_mean"] + 1e-10)
        stats[f"{prefix}_mad"] = np.mean(np.abs(col_data - np.mean(col_data)))
        stats[f"{prefix}_sma"] = np.sum(np.abs(col_data)) / len(col_data)
    
    # Cross-correlations
    for i in range(num_cols):
        for j in range(i+1, num_cols):
            corr = np.corrcoef(data[:, i], data[:, j])[0, 1]
            stats[f"corr_{i+1}_{j+1}"] = corr if not np.isnan(corr) else 0
            stats[f"ratio_mean_{i+1}_{j+1}"] = np.mean(data[:, i]) / (np.mean(data[:, j]) + 1e-10)
    
    return stats


def predict_smile_score(features: np.ndarray) -> float:
    """Predict smile score from extracted features"""
    stats = calculate_statistics(features)
    
    X = np.array([[stats.get(col, 0) for col in feature_cols]])
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    
    X_scaled = scaler.transform(X)
    prediction = model.predict(X_scaled)[0]
    
    return float(prediction)


def get_interpretation(score: float) -> str:
    """Get human-readable interpretation of smile score"""
    if score >= 6.0:
        return "Very High - Candidate showed excellent positive engagement and frequent smiling"
    elif score >= 5.0:
        return "High - Candidate displayed good positive expressions throughout"
    elif score >= 4.0:
        return "Moderate - Candidate showed average engagement with some positive expressions"
    elif score >= 3.0:
        return "Low - Candidate displayed limited positive expressions"
    else:
        return "Very Low - Candidate showed minimal smiling or positive engagement"


def get_confidence(frames: int) -> str:
    """Get confidence level based on frames processed"""
    if frames >= 500:
        return "High"
    elif frames >= 200:
        return "Medium"
    else:
        return "Low"


# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        model_loaded=model is not None,
        r2_score=artifacts['r2_score']
    )


@app.post("/api/analyze-video", response_model=AnalysisResult)
async def analyze_video(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Upload and analyze a video for smile score
    
    - **file**: Video file (mp4, avi, webm, mov)
    
    Returns smile score prediction and interpretation
    """
    start_time = datetime.now()
    request_id = str(uuid.uuid4())
    
    # Validate file type
    allowed_types = ['video/mp4', 'video/avi', 'video/webm', 'video/quicktime']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: mp4, avi, webm, mov"
        )
    
    # Save uploaded file
    video_path = os.path.join(UPLOAD_DIR, f"{request_id}_{file.filename}")
    
    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract features
        features = extract_features_from_video(video_path)
        
        if len(features) < 10:
            raise HTTPException(
                status_code=400,
                detail="Video too short or no faces detected"
            )
        
        # Predict smile score
        smile_score = predict_smile_score(features)
        
        # Calculate processing time
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Schedule cleanup
        if background_tasks:
            background_tasks.add_task(os.remove, video_path)
        
        return AnalysisResult(
            request_id=request_id,
            smile_score=round(smile_score, 4),
            confidence=get_confidence(len(features)),
            frames_processed=len(features),
            processing_time_ms=processing_time,
            timestamp=datetime.now().isoformat(),
            interpretation=get_interpretation(smile_score)
        )
        
    except Exception as e:
        # Cleanup on error
        if os.path.exists(video_path):
            os.remove(video_path)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze-features", response_model=AnalysisResult)
async def analyze_features(input_data: FeatureInput):
    """
    Analyze pre-extracted SHORE features
    
    - **features**: 2D array of shape (n_frames, 5)
    
    Use this when you've already extracted features using SHORE SDK
    """
    start_time = datetime.now()
    request_id = str(uuid.uuid4())
    
    try:
        features = np.array(input_data.features)
        
        if features.shape[1] != 5:
            raise HTTPException(
                status_code=400,
                detail="Features must have 5 columns"
            )
        
        if len(features) < 10:
            raise HTTPException(
                status_code=400,
                detail="Need at least 10 frames of data"
            )
        
        # Predict
        smile_score = predict_smile_score(features)
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return AnalysisResult(
            request_id=request_id,
            smile_score=round(smile_score, 4),
            confidence=get_confidence(len(features)),
            frames_processed=len(features),
            processing_time_ms=processing_time,
            timestamp=datetime.now().isoformat(),
            interpretation=get_interpretation(smile_score)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("SMILE SCORE PREDICTION API SERVER")
    print("="*60)
    print(f"Model R² Score: {artifacts['r2_score']:.4f}")
    print("Starting server at http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)


"""
Unified API Server for Gesture and Smile Analysis Models
Test both models easily from Postman or any HTTP client

Endpoints:
    POST /api/analyze-gesture    - Analyze gestures from video
    POST /api/analyze-smile      - Analyze smile/facial expressions from video
    POST /api/analyze-all        - Analyze both gesture and smile (combined)
    GET  /api/health             - Health check
    GET  /docs                   - Interactive API documentation (Swagger UI)
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import sys
import tempfile
import logging
from datetime import datetime
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Unified Models API",
    description="API server for Gesture Analysis and Smile/Facial Analysis models",
    version="1.0.0"
)

# Add CORS middleware (allow all origins for testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
gesture_predictor = None
smile_predictor = None

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GESTURE_MODEL_DIR = os.path.join(BASE_DIR, "Models", "gesture analysis model")
SMILE_MODEL_DIR = os.path.join(BASE_DIR, "Models", "smile model")


# ============================================================
# MODEL LOADERS
# ============================================================

def load_gesture_model():
    """Load gesture analysis model"""
    global gesture_predictor
    
    try:
        # Add gesture model directory to path
        sys.path.insert(0, GESTURE_MODEL_DIR)
        
        # Import gesture predictor
        from predict_gesture import GesturePredictor
        
        # Load model
        model_path = os.path.join(GESTURE_MODEL_DIR, "gesture_model.h5")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Gesture model not found: {model_path}")
        
        gesture_predictor = GesturePredictor(model_path)
        logger.info("✅ Gesture model loaded successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load gesture model: {e}")
        logger.error(traceback.format_exc())
        gesture_predictor = None
        return False


def load_smile_model():
    """Load smile/facial analysis model"""
    global smile_predictor
    
    try:
        # Add smile model directory to path
        sys.path.insert(0, SMILE_MODEL_DIR)
        
        # Import smile pipeline
        from video_smile_pipeline import process_uploaded_video
        
        # Check model exists
        model_path = os.path.join(SMILE_MODEL_DIR, "smile_model.joblib")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Smile model not found: {model_path}")
        
        # Store the function for later use
        smile_predictor = process_uploaded_video
        logger.info("✅ Smile model loaded successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to load smile model: {e}")
        logger.error(traceback.format_exc())
        smile_predictor = None
        return False


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def save_uploaded_file(file: UploadFile) -> str:
    """Save uploaded file to temporary location"""
    suffix = os.path.splitext(file.filename)[1] or ".mp4"
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    
    try:
        content = file.file.read()
        temp_file.write(content)
        temp_file.flush()
        return temp_file.name
    finally:
        temp_file.close()


def cleanup_file(file_path: str):
    """Delete temporary file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up temporary file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to cleanup file {file_path}: {e}")


# ============================================================
# STARTUP EVENT
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Initialize models on server startup"""
    logger.info("=" * 70)
    logger.info("Starting Unified Models API Server")
    logger.info("=" * 70)
    
    # Load gesture model
    logger.info("\n[1/2] Loading Gesture Analysis Model...")
    gesture_loaded = load_gesture_model()
    
    # Load smile model
    logger.info("\n[2/2] Loading Smile/Facial Analysis Model...")
    smile_loaded = load_smile_model()
    
    logger.info("\n" + "=" * 70)
    logger.info("Server Startup Summary:")
    logger.info(f"  Gesture Model: {'✅ Loaded' if gesture_loaded else '❌ Failed'}")
    logger.info(f"  Smile Model:   {'✅ Loaded' if smile_loaded else '❌ Failed'}")
    logger.info("=" * 70)
    logger.info("\n🚀 Server ready! Visit http://localhost:8000/docs for API documentation")
    logger.info("=" * 70 + "\n")


# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Unified Models API Server",
        "version": "1.0.0",
        "endpoints": {
            "gesture_analysis": "POST /api/analyze-gesture",
            "smile_analysis": "POST /api/analyze-smile",
            "combined_analysis": "POST /api/analyze-all",
            "health_check": "GET /api/health",
            "documentation": "GET /docs"
        },
        "models_status": {
            "gesture": "✅ Loaded" if gesture_predictor else "❌ Not loaded",
            "smile": "✅ Loaded" if smile_predictor else "❌ Not loaded"
        }
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "gesture": {
                "loaded": gesture_predictor is not None,
                "path": GESTURE_MODEL_DIR
            },
            "smile": {
                "loaded": smile_predictor is not None,
                "path": SMILE_MODEL_DIR
            }
        }
    }


@app.post("/api/analyze-gesture")
async def analyze_gesture(file: UploadFile = File(...)):
    """
    Analyze gestures from video file
    
    **Request:**
    - Method: POST
    - Content-Type: multipart/form-data
    - Body: video file (form-data key: "file")
    
    **Response:**
    ```json
    {
        "success": true,
        "model": "gesture",
        "video_name": "video.mp4",
        "scores": {
            "self_touch": 2.5,
            "hands_on_table": 3.2,
            "hidden_hands": 1.1,
            "gestures_on_table": 4.8,
            "other_gestures": 5.3
        },
        "processing_time_seconds": 12.5,
        "frames_processed": 1500
    }
    ```
    """
    if not gesture_predictor:
        raise HTTPException(
            status_code=503,
            detail="Gesture model not loaded. Please check server logs."
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('video/'):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Expected video file."
        )
    
    temp_file_path = None
    start_time = datetime.now()
    
    try:
        # Save uploaded file
        logger.info(f"Received gesture analysis request: {file.filename}")
        temp_file_path = save_uploaded_file(file)
        logger.info(f"Saved to temporary file: {temp_file_path}")
        
        # Import process_video function
        sys.path.insert(0, GESTURE_MODEL_DIR)
        from process_video import extract_landmarks_from_video, calculate_scores
        from predict_gesture import SEQUENCE_LENGTH
        
        # Extract landmarks
        logger.info("Extracting landmarks from video...")
        landmarks_sequence = extract_landmarks_from_video(temp_file_path)
        
        if len(landmarks_sequence) == 0:
            raise HTTPException(
                status_code=400,
                detail="No landmarks extracted from video. Ensure video contains visible person with hands."
            )
        
        # Make predictions using sliding window
        logger.info("Making gesture predictions...")
        predictions = []
        window_size = SEQUENCE_LENGTH
        stride = window_size // 3
        
        for start_idx in range(0, len(landmarks_sequence) - window_size + 1, stride):
            window = landmarks_sequence[start_idx:start_idx + window_size]
            result = gesture_predictor.predict(window)
            predictions.append(result['class'])
        
        # Last window if needed
        if len(landmarks_sequence) >= window_size:
            last_window = landmarks_sequence[-window_size:]
            result = gesture_predictor.predict(last_window)
            predictions.append(result['class'])
        
        # Calculate scores
        scores = calculate_scores(predictions, len(predictions))
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Format response
        response = {
            "success": True,
            "model": "gesture",
            "video_name": file.filename,
            "scores": {
                "self_touch": scores.get('self_touch', 0),
                "hands_on_table": scores.get('hands_on_table', 0),
                "hidden_hands": scores.get('hidden_hands', 0),
                "gestures_on_table": scores.get('gestures_on_table', 0),
                "other_gestures": scores.get('other_gestures', 0)
            },
            "processing_time_seconds": round(processing_time, 2),
            "frames_processed": len(landmarks_sequence),
            "total_predictions": len(predictions)
        }
        
        logger.info(f"Gesture analysis completed in {processing_time:.2f}s")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in gesture analysis: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error processing video: {str(e)}"
        )
    finally:
        if temp_file_path:
            cleanup_file(temp_file_path)


@app.post("/api/analyze-smile")
async def analyze_smile(file: UploadFile = File(...)):
    """
    Analyze smile/facial expressions from video file
    
    **Request:**
    - Method: POST
    - Content-Type: multipart/form-data
    - Body: video file (form-data key: "file")
    
    **Response:**
    ```json
    {
        "success": true,
        "model": "smile",
        "video_name": "video.mp4",
        "smile_score": 5.42,
        "interpretation": "High - Good positive expressions",
        "frames_processed": 300,
        "video_duration_seconds": 30.0,
        "processing_time_seconds": 8.5
    }
    ```
    """
    if not smile_predictor:
        raise HTTPException(
            status_code=503,
            detail="Smile model not loaded. Please check server logs."
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('video/'):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Expected video file."
        )
    
    temp_file_path = None
    start_time = datetime.now()
    
    try:
        # Save uploaded file
        logger.info(f"Received smile analysis request: {file.filename}")
        temp_file_path = save_uploaded_file(file)
        logger.info(f"Saved to temporary file: {temp_file_path}")
        
        # Process video using smile model
        logger.info("Processing video with smile model...")
        result = smile_predictor(temp_file_path)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Format response
        response = {
            "success": True,
            "model": "smile",
            "video_name": file.filename,
            "smile_score": result.get('smile_score', 0),
            "interpretation": result.get('interpretation', 'Unknown'),
            "frames_processed": result.get('frames_processed', 0),
            "video_duration_seconds": result.get('video_duration_seconds', 0),
            "processing_time_seconds": round(processing_time, 2)
        }
        
        logger.info(f"Smile analysis completed in {processing_time:.2f}s")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in smile analysis: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error processing video: {str(e)}"
        )
    finally:
        if temp_file_path:
            cleanup_file(temp_file_path)


@app.post("/api/analyze-all")
async def analyze_all(file: UploadFile = File(...)):
    """
    Analyze both gestures and smile from video file (combined analysis)
    
    **Request:**
    - Method: POST
    - Content-Type: multipart/form-data
    - Body: video file (form-data key: "file")
    
    **Response:**
    ```json
    {
        "success": true,
        "video_name": "video.mp4",
        "gesture_analysis": { ... },
        "smile_analysis": { ... },
        "total_processing_time_seconds": 20.5
    }
    ```
    """
    temp_file_path = None
    start_time = datetime.now()
    
    try:
        # Save uploaded file
        logger.info(f"Received combined analysis request: {file.filename}")
        temp_file_path = save_uploaded_file(file)
        
        results = {
            "success": True,
            "video_name": file.filename,
            "gesture_analysis": None,
            "smile_analysis": None
        }
        
        # Analyze gestures
        if gesture_predictor:
            try:
                logger.info("Running gesture analysis...")
                # Import and use the processing functions directly
                sys.path.insert(0, GESTURE_MODEL_DIR)
                from process_video import extract_landmarks_from_video, calculate_scores
                from predict_gesture import SEQUENCE_LENGTH
                
                landmarks_sequence = extract_landmarks_from_video(temp_file_path)
                if len(landmarks_sequence) == 0:
                    raise ValueError("No landmarks extracted from video")
                
                predictions = []
                window_size = SEQUENCE_LENGTH
                stride = window_size // 3
                
                for start_idx in range(0, len(landmarks_sequence) - window_size + 1, stride):
                    window = landmarks_sequence[start_idx:start_idx + window_size]
                    result = gesture_predictor.predict(window)
                    predictions.append(result['class'])
                
                if len(landmarks_sequence) >= window_size:
                    last_window = landmarks_sequence[-window_size:]
                    result = gesture_predictor.predict(last_window)
                    predictions.append(result['class'])
                
                scores = calculate_scores(predictions, len(predictions))
                
                results["gesture_analysis"] = {
                    "success": True,
                    "model": "gesture",
                    "video_name": file.filename,
                    "scores": {
                        "self_touch": scores.get('self_touch', 0),
                        "hands_on_table": scores.get('hands_on_table', 0),
                        "hidden_hands": scores.get('hidden_hands', 0),
                        "gestures_on_table": scores.get('gestures_on_table', 0),
                        "other_gestures": scores.get('other_gestures', 0)
                    },
                    "frames_processed": len(landmarks_sequence),
                    "total_predictions": len(predictions)
                }
            except Exception as e:
                logger.error(f"Gesture analysis failed: {e}")
                logger.error(traceback.format_exc())
                results["gesture_analysis"] = {
                    "success": False,
                    "error": str(e)
                }
        else:
            results["gesture_analysis"] = {
                "success": False,
                "error": "Gesture model not loaded"
            }
        
        # Analyze smile
        if smile_predictor:
            try:
                logger.info("Running smile analysis...")
                # Use the smile predictor function directly
                smile_result = smile_predictor(temp_file_path)
                
                results["smile_analysis"] = {
                    "success": True,
                    "model": "smile",
                    "video_name": file.filename,
                    "smile_score": smile_result.get('smile_score', 0),
                    "interpretation": smile_result.get('interpretation', 'Unknown'),
                    "frames_processed": smile_result.get('frames_processed', 0),
                    "video_duration_seconds": smile_result.get('video_duration_seconds', 0)
                }
            except Exception as e:
                logger.error(f"Smile analysis failed: {e}")
                logger.error(traceback.format_exc())
                results["smile_analysis"] = {
                    "success": False,
                    "error": str(e)
                }
        else:
            results["smile_analysis"] = {
                "success": False,
                "error": "Smile model not loaded"
            }
        
        # Calculate total processing time
        total_time = (datetime.now() - start_time).total_seconds()
        results["total_processing_time_seconds"] = round(total_time, 2)
        
        logger.info(f"Combined analysis completed in {total_time:.2f}s")
        return results
        
    except Exception as e:
        logger.error(f"Error in combined analysis: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error processing video: {str(e)}"
        )
    finally:
        if temp_file_path:
            cleanup_file(temp_file_path)


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "=" * 70)
    print("Unified Models API Server")
    print("=" * 70)
    print("\nStarting server on http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/api/health")
    print("\n" + "=" * 70 + "\n")
    
    uvicorn.run(
        "unified_models_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


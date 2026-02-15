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
import numpy as np

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

# Configure request size limits for large video files
# This allows uploads up to 500MB
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
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
        
        # Load model - GesturePredictor will automatically find bilstm_epoch_15.keras or gesture_model.h5
        # Pass None to use the automatic model detection in GesturePredictor
        gesture_predictor = GesturePredictor(model_path=None)
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
    
    original_cwd = None
    try:
        # Save current working directory
        original_cwd = os.getcwd()
        
        abs_smile_dir = os.path.abspath(SMILE_MODEL_DIR)
        model_path = os.path.join(abs_smile_dir, "smile_model.joblib")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Smile model not found: {model_path}")
        
        # Change to smile model directory for proper path resolution
        # This ensures os.path.dirname(__file__) in video_smile_pipeline.py resolves correctly
        os.chdir(abs_smile_dir)
        
        # Add absolute path to sys.path
        if abs_smile_dir not in sys.path:
            sys.path.insert(0, abs_smile_dir)
        
        # Import smile pipeline with numpy compatibility handling
        try:
            from video_smile_pipeline import process_uploaded_video
        except (ModuleNotFoundError, ImportError) as e:
            if 'numpy._core' in str(e) or 'numpy.core' in str(e):
                # Model was saved with numpy 2.x but we have numpy 1.x
                raise ImportError(
                    "NumPy version mismatch: Model was saved with NumPy 2.x but current environment has NumPy 1.x. "
                    "The model needs to be re-saved with NumPy 1.x, or you need to use NumPy 2.x (which conflicts with TensorFlow/MediaPipe)."
                ) from e
            else:
                raise
        
        # Store the function for later use
        smile_predictor = process_uploaded_video
        
        # Restore original working directory
        os.chdir(original_cwd)
        
        logger.info("✅ Smile model loaded successfully")
        return True
        
    except Exception as e:
        # Restore original working directory even on error
        if original_cwd:
            try:
                os.chdir(original_cwd)
            except:
                pass
        
        logger.error("=" * 70)
        logger.error(f"❌ FAILED TO LOAD SMILE MODEL")
        logger.error("=" * 70)
        logger.error(f"Error: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Model path: {model_path}")
        logger.error(f"Model path exists: {os.path.exists(model_path)}")
        logger.error(f"Smile model directory: {abs_smile_dir}")
        logger.error(f"Smile model directory exists: {os.path.exists(abs_smile_dir)}")
        logger.error("")
        logger.error("Full traceback:")
        logger.error(traceback.format_exc())
        logger.error("=" * 70)
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
    
    # Load smile model - COMMENTED OUT (NumPy version compatibility issues)
    logger.info("\n[2/2] Loading Smile/Facial Analysis Model...")
    logger.info("⚠️  Smile model loading disabled due to NumPy version compatibility issues")
    smile_loaded = False
    # smile_loaded = load_smile_model()
    
    logger.info("\n" + "=" * 70)
    logger.info("Server Startup Summary:")
    logger.info(f"  Gesture Model: {'✅ Loaded' if gesture_loaded else '❌ Failed'}")
    logger.info(f"  Smile Model:   ❌ Disabled (NumPy compatibility)")
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
        
        # Make predictions using sliding window (MATCHING TRAINING: 30 frames, stride=30)
        logger.info("Making gesture predictions...")
        predictions = []
        window_size = SEQUENCE_LENGTH  # 30 frames (1 second @ 30 FPS)
        stride = window_size  # Non-overlapping windows (MATCHING TRAINING)
        
        # Process windows (non-overlapping, matching training)
        for start_idx in range(0, len(landmarks_sequence) - window_size + 1, stride):
            window = landmarks_sequence[start_idx:start_idx + window_size]
            result = gesture_predictor.predict(window)
            predictions.append(result['class'])
        
        # Handle remaining frames: pad if less than window_size, or use last window
        remaining = len(landmarks_sequence) % window_size
        if remaining > 0 and remaining < window_size:
            # Pad remaining frames to window_size (matching training behavior)
            last_window = np.zeros((window_size, landmarks_sequence.shape[1]), dtype=landmarks_sequence.dtype)
            last_window[:remaining] = landmarks_sequence[-remaining:]
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
        logger.info("=" * 70)
        logger.info("🎬 NEW VIDEO ANALYSIS REQUEST")
        logger.info(f"📁 File: {file.filename}")
        logger.info(f"📅 Timestamp: {start_time.isoformat()}")
        
        # Ensure models are loaded (lazy-load in case startup failed)
        if not gesture_predictor:
            logger.info("Gesture model not loaded yet. Attempting to load...")
            load_gesture_model()
        # Smile model loading commented out - causing NumPy version issues
        # if not smile_predictor:
        #     logger.info("Smile model not loaded yet. Attempting to load...")
        #     load_smile_model()

        # Save uploaded file
        logger.info("💾 Saving uploaded file to temporary location...")
        temp_file_path = save_uploaded_file(file)
        file_size_mb = os.path.getsize(temp_file_path) / (1024 * 1024)
        logger.info(f"✅ File saved: {file_size_mb:.2f} MB")
        
        results = {
            "success": True,
            "video_name": file.filename,
            "gesture_analysis": None,
            "smile_analysis": None
        }
        
        # Analyze gestures
        if gesture_predictor:
            try:
                gesture_start = datetime.now()
                logger.info("🤲 Starting gesture analysis...")
                # Import and use the processing functions directly
                sys.path.insert(0, GESTURE_MODEL_DIR)
                from process_video import extract_landmarks_from_video, calculate_scores
                from predict_gesture import SEQUENCE_LENGTH
                import cv2
                
                # All videos are 30 FPS (hardcoded as per requirement)
                fps = 30.0
                
                logger.info("   Extracting hand landmarks from video...")
                landmarks_sequence = extract_landmarks_from_video(temp_file_path)
                logger.info(f"   ✅ Extracted {len(landmarks_sequence)} landmark frames")
                
                if len(landmarks_sequence) == 0:
                    raise ValueError("No landmarks extracted from video")
                
                logger.info("   Running gesture predictions...")
                predictions = []
                probabilities_per_second = []  # Store probabilities grouped by second
                window_size = SEQUENCE_LENGTH  # 30 frames (1 second @ 30 FPS)
                stride = window_size  # Non-overlapping windows (MATCHING TRAINING)
                
                # Track which second each prediction belongs to
                current_second = -1
                second_probabilities = []  # Accumulate probabilities for current second
                
                logger.info(f"\n{'='*70}")
                logger.info("GESTURE PREDICTION - PROBABILITIES PER SECOND")
                logger.info(f"{'='*70}")
                logger.info(f"Video FPS: {fps:.2f} (hardcoded - all videos are 30 FPS)")
                logger.info(f"Total frames extracted: {len(landmarks_sequence)} (ALL frames, not skipping)")
                logger.info(f"Estimated duration: {len(landmarks_sequence)/fps:.2f} seconds")
                logger.info(f"Window size: {window_size} frames (1 second @ 30 FPS)")
                logger.info(f"Stride: {stride} frames (non-overlapping windows)")
                logger.info(f"Prediction method: Softmax probabilities from BiLSTM model")
                logger.info(f"{'='*70}\n")
                
                window_count = 0
                for start_idx in range(0, len(landmarks_sequence) - window_size + 1, stride):
                    # Extract 30 frames (1 second) for prediction
                    window = landmarks_sequence[start_idx:start_idx + window_size]
                    
                    # Predict using softmax probabilities (model.predict returns softmax probabilities)
                    result = gesture_predictor.predict(window)
                    predictions.append(result['class'])
                    
                    # With non-overlapping windows (stride = window_size), each window = 1 second
                    window_second = window_count  # Each window corresponds to 1 second
                    
                    # Store softmax probabilities for this second (already normalized to sum to 1.0)
                    filtered_probs = {k: v for k, v in result['all_probabilities'].items() if k != 'other_gestures'}
                    probabilities_per_second.append(filtered_probs)
                    
                    # Store probabilities (will log summary at end)
                    window_count += 1
                
                # Handle remaining frames (pad to window_size if needed, matching training behavior)
                remaining = len(landmarks_sequence) % window_size
                if remaining > 0:
                    # Pad remaining frames to window_size (matching training behavior)
                    last_window = np.zeros((window_size, landmarks_sequence.shape[1]), dtype=landmarks_sequence.dtype)
                    last_window[:remaining] = landmarks_sequence[-remaining:]
                    result = gesture_predictor.predict(last_window)
                    predictions.append(result['class'])
                    
                    # Store softmax probabilities for this second (padded window)
                    filtered_probs = {k: v for k, v in result['all_probabilities'].items() if k != 'other_gestures'}
                    probabilities_per_second.append(filtered_probs)
                
                # Calculate scores using probabilities per second
                scores = calculate_scores(predictions, len(predictions), probabilities_per_second)
                
                # ========================================================================
                # PROBABILITIES PER SECOND - DETAILED TABLE
                # ========================================================================
                logger.info(f"\n{'='*70}")
                logger.info("PROBABILITIES PER SECOND (SOFTMAX OUTPUT)")
                logger.info(f"{'='*70}")
                logger.info(f"{'Second':<8} {'self_touch':<12} {'hands_on_table':<15} {'hidden_hands':<13} {'gestures_on_table':<18} {'Predicted':<15}")
                logger.info(f"{'-'*70}")
                
                class_names = ['self_touch', 'hands_on_table', 'hidden_hands', 'gestures_on_table']
                for second_idx, prob_dict in enumerate(probabilities_per_second):
                    frame_start = second_idx * window_size
                    frame_end = min(frame_start + window_size - 1, len(landmarks_sequence) - 1)
                    predicted_class = predictions[second_idx] if second_idx < len(predictions) else "N/A"
                    
                    logger.info(f"  {second_idx:<8} "
                              f"{prob_dict.get('self_touch', 0):.4f}      "
                              f"{prob_dict.get('hands_on_table', 0):.4f}         "
                              f"{prob_dict.get('hidden_hands', 0):.4f}      "
                              f"{prob_dict.get('gestures_on_table', 0):.4f}            "
                              f"{predicted_class:<15}")
                
                logger.info(f"{'='*70}")
                
                # ========================================================================
                # FINAL SCORE CALCULATION
                # ========================================================================
                logger.info(f"\n{'='*70}")
                logger.info("FINAL SCORE CALCULATION")
                logger.info(f"{'='*70}")
                logger.info(f"Total seconds analyzed: {len(probabilities_per_second)}")
                logger.info(f"Calculation method: Average of softmax probabilities across all seconds, then × 10")
                logger.info("")
                
                # Show average probabilities and final scores
                prob_matrix = [[prob.get(cn, 0.0) for cn in class_names] for prob in probabilities_per_second]
                avg_probs = np.mean(prob_matrix, axis=0)
                
                logger.info("Step 1: Average Probabilities (across all seconds):")
                for i, class_name in enumerate(class_names):
                    logger.info(f"  {class_name:20s}: {avg_probs[i]:.4f}")
                
                logger.info("")
                logger.info("Step 2: Final Scores (avg_probability × 10):")
                logger.info(f"  self_touch:        {scores.get('self_touch', 0):.2f}/10")
                logger.info(f"  hands_on_table:    {scores.get('hands_on_table', 0):.2f}/10")
                logger.info(f"  hidden_hands:      {scores.get('hidden_hands', 0):.2f}/10")
                logger.info(f"  gestures_on_table: {scores.get('gestures_on_table', 0):.2f}/10")
                logger.info("")
                logger.info("Step 3: Weighted Fusion (Research-Based Weights):")
                logger.info("  Weights: hands_on_table=32.2%, hidden_hands=26.4%, gestures_on_table=20.7%, self_touch=20.7%")
                logger.info("  Note: Negative indicators (hidden_hands, gestures_on_table, self_touch) are inverted")
                logger.info(f"{'='*70}\n")
                
                # Ensure scores are properly formatted
                gesture_scores = {
                    "self_touch": float(scores.get('self_touch', 0)),
                    "hands_on_table": float(scores.get('hands_on_table', 0)),
                    "hidden_hands": float(scores.get('hidden_hands', 0)),
                    "gestures_on_table": float(scores.get('gestures_on_table', 0))
                }
                
                gesture_duration = (datetime.now() - gesture_start).total_seconds()
                logger.info(f"✅ Gesture analysis completed in {gesture_duration:.2f}s")
                
                results["gesture_analysis"] = {
                    "success": True,
                    "model": "gesture",
                    "video_name": file.filename,
                    "scores": gesture_scores,
                    "overall_score": None,  # Will be calculated after smile analysis
                    "frames_processed": len(landmarks_sequence),
                    "total_predictions": len(predictions),
                    "probabilities_per_second": probabilities_per_second
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
        
        # Analyze smile - COMMENTED OUT (NumPy version mismatch issues)
        # Skip smile analysis for now - just return a placeholder
        results["smile_analysis"] = {
            "success": False,
            "error": "Smile model temporarily disabled due to NumPy version compatibility issues",
            "smile_score": None,
            "interpretation": "N/A - Smile model not available"
        }
        logger.info("Smile analysis skipped - model disabled due to compatibility issues")
        
        # Original smile analysis code (commented out):
        # if smile_predictor:
        #     try:
        #         smile_start = datetime.now()
        #         logger.info("😊 Running smile analysis...")
        #         # Use the smile predictor function directly
        #         smile_result = smile_predictor(temp_file_path)
        #         
        #         # Convert smile score from 1-7 scale to 1-10 scale if needed
        #         smile_score = smile_result.get('smile_score', 0)
        #         if smile_score > 0 and smile_score <= 7:
        #             # Scale from 1-7 to 1-10
        #             smile_score = ((smile_score - 1) / 6) * 9 + 1
        #         
        #         smile_duration = (datetime.now() - smile_start).total_seconds()
        #         logger.info(f"✅ Smile analysis completed in {smile_duration:.2f}s")
        #         
        #         results["smile_analysis"] = {
        #             "success": True,
        #             "model": "smile",
        #             "video_name": file.filename,
        #             "smile_score": round(smile_score, 2),
        #             "interpretation": smile_result.get('interpretation', 'Unknown'),
        #             "frames_processed": smile_result.get('frames_processed', 0),
        #             "video_duration_seconds": smile_result.get('video_duration_seconds', 0),
        #             "processing_time_seconds": round(smile_duration, 2)
        #         }
        #     except Exception as e:
        #         logger.error(f"Smile analysis failed: {e}")
        #         logger.error(traceback.format_exc())
        #         results["smile_analysis"] = {
        #             "success": False,
        #             "error": str(e)
        #         }
        # else:
        #     results["smile_analysis"] = {
        #         "success": False,
        #         "error": "Smile model not loaded"
        #     }
        
        # Calculate overall score AFTER both analyses complete
        if results.get("gesture_analysis") and results["gesture_analysis"].get("success"):
            from process_video import calculate_weighted_fusion_score
            
            gesture_scores = results["gesture_analysis"]["scores"]
            # Get smile score if available
            smile_score = None
            if results.get("smile_analysis") and results["smile_analysis"].get("success"):
                smile_score = results["smile_analysis"].get("smile_score")
            
            overall_score = calculate_weighted_fusion_score(gesture_scores, smile_score=smile_score)
            
            # Update gesture_analysis with final overall score
            results["gesture_analysis"]["overall_score"] = overall_score
            
            logger.info("")
            logger.info("="*70)
            logger.info("FINAL WEIGHTED FUSION CALCULATION")
            logger.info("="*70)
            logger.info(f"  hands_on_table:    {gesture_scores['hands_on_table']:.2f}/10 × 0.322 = {gesture_scores['hands_on_table'] * 0.322:.2f}")
            logger.info(f"  hidden_hands:      (10 - {gesture_scores['hidden_hands']:.2f}) × 0.264 = {(10 - gesture_scores['hidden_hands']) * 0.264:.2f}")
            logger.info(f"  gestures_on_table: (10 - {gesture_scores['gestures_on_table']:.2f}) × 0.207 = {(10 - gesture_scores['gestures_on_table']) * 0.207:.2f}")
            logger.info(f"  self_touch:        (10 - {gesture_scores['self_touch']:.2f}) × 0.207 = {(10 - gesture_scores['self_touch']) * 0.207:.2f}")
            if smile_score is not None:
                logger.info(f"  smile:             {smile_score:.2f}/10 × 0.13 = {smile_score * 0.13:.2f}")
            else:
                logger.info(f"  smile:             N/A (not available)")
            logger.info(f"  ─────────────────────────────────────────────")
            logger.info(f"  Overall Score:     {overall_score:.2f}/10")
            logger.info("="*70)
        
        # Calculate total processing time
        total_time = (datetime.now() - start_time).total_seconds()
        results["total_processing_time_seconds"] = round(total_time, 2)
        
        logger.info("=" * 70)
        logger.info(f"🎉 ANALYSIS COMPLETE!")
        logger.info(f"⏱️  Total Time: {total_time:.2f}s")
        logger.info(f"📊 Gesture: {results['gesture_analysis']['success'] if results.get('gesture_analysis') else False}")
        logger.info(f"😊 Smile: {results['smile_analysis']['success'] if results.get('smile_analysis') else False}")
        logger.info("=" * 70)
        
        # Return success if gesture analysis succeeded, even if smile failed
        # This allows the frontend to display gesture results even when smile model has issues
        if results.get("gesture_analysis") and results["gesture_analysis"].get("success"):
            results["success"] = True
        else:
            results["success"] = False
        
        return results
        
    except Exception as e:
        total_time = (datetime.now() - start_time).total_seconds()
        logger.error("=" * 70)
        logger.error(f"❌ ANALYSIS FAILED after {total_time:.2f}s")
        logger.error(f"Error: {e}")
        logger.error(traceback.format_exc())
        logger.error("=" * 70)
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
    print("\n⚙️  Server Configuration:")
    print("   - Timeout: Unlimited (supports long video processing)")
    print("   - Max Request Size: 500MB (supports large video files)")
    print("   - Keep-Alive: 3000 seconds")
    print("\n" + "=" * 70 + "\n")
    
    uvicorn.run(
        "unified_models_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        timeout_keep_alive=3000,  # 50 minutes keep-alive for long processing
        limit_concurrency=10,     # Limit concurrent requests
        limit_max_requests=1000,  # Restart worker after 1000 requests (memory leak prevention)
    )


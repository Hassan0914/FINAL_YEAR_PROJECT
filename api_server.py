from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import mediapipe as mp
import pandas as pd
import numpy as np
import tempfile
import os
import json
from typing import Dict, List
import uvicorn
from predict_new_video import NewVideoGesturePredictor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Gesture Prediction API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

# Global predictor instance
predictor = None

@app.on_event("startup")
async def startup_event():
    """Initialize the gesture predictor on startup"""
    global predictor
    try:
        predictor = NewVideoGesturePredictor()
        logger.info(" Gesture predictor initialized successfully")
    except Exception as e:
        logger.error(f" Failed to initialize predictor: {e}")
        raise

def extract_mediapipe_landmarks(video_path: str) -> pd.DataFrame:
    """
    Extract MediaPipe landmarks from video file
    
    Args:
        video_path (str): Path to the video file
        
    Returns:
        pd.DataFrame: DataFrame containing landmarks for each frame
    """
    logger.info(f" Processing video: {video_path}")
    
    # Initialize MediaPipe hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # Open video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video file")
    
    landmarks_data = []
    frame_number = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame with MediaPipe
            results = hands.process(rgb_frame)
            
            # Initialize frame data
            frame_data = {
                'frame_number': frame_number,
                'left_hand_detected': False,
                'right_hand_detected': False
            }
            
            # Extract landmarks for each hand
            if results.multi_hand_landmarks:
                for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                    # Determine hand label (left/right)
                    hand_label = results.multi_handedness[idx].classification[0].label
                    hand_prefix = hand_label.lower()
                    
                    # Mark hand as detected
                    frame_data[f'{hand_prefix}_hand_detected'] = True
                    
                    # Extract all 21 landmarks
                    landmark_names = [
                        'WRIST', 'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
                        'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
                        'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
                        'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
                        'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP'
                    ]
                    
                    for i, landmark in enumerate(hand_landmarks.landmark):
                        landmark_name = landmark_names[i]
                        frame_data[f'{hand_prefix}_{landmark_name}_x'] = landmark.x
                        frame_data[f'{hand_prefix}_{landmark_name}_y'] = landmark.y
                        frame_data[f'{hand_prefix}_{landmark_name}_z'] = landmark.z
            
            landmarks_data.append(frame_data)
            frame_number += 1
            
            # Limit processing to first 300 frames (10 seconds at 30fps)
            if frame_number >= 300:
                break
                
    finally:
        cap.release()
        hands.close()
    
    logger.info(f" Extracted landmarks from {len(landmarks_data)} frames")
    return pd.DataFrame(landmarks_data)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Gesture Prediction API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "predictor_loaded": predictor is not None,
        "models_available": len(predictor.models) if predictor else 0
    }

@app.post("/predict-gestures")
async def predict_gestures(file: UploadFile = File(...)):
    """
    Upload video file and predict gesture scores
    
    Args:
        file: Video file (MP4, MOV, AVI, etc.)
        
    Returns:
        JSON response with gesture scores (1-7 scale)
    """
    if not predictor:
        raise HTTPException(status_code=500, detail="Predictor not initialized")
    
    # Validate file type
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_file:
        try:
            # Save uploaded file
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            
            logger.info(f" Saved video to temporary file: {temp_file.name}")
            
            # Extract MediaPipe landmarks
            landmarks_df = extract_mediapipe_landmarks(temp_file.name)
            
            if landmarks_df.empty:
                raise HTTPException(status_code=400, detail="No landmarks detected in video")
            
            # Predict gesture scores
            predictions = predictor.predict_from_landmarks_data(landmarks_df)
            
            if not predictions:
                raise HTTPException(status_code=500, detail="Failed to generate predictions")
            
            # Format response
            response = {
                "success": True,
                "gesture_scores": {
                    "hidden_hands": predictions.get('hidden_hands_score', 1),
                    "hands_on_table": predictions.get('hands_on_table_score', 1),
                    "gestures_on_table": predictions.get('gestures_on_table_score', 1),
                    "other_gestures": predictions.get('other_gestures_score', 1),
                    "self_touch": predictions.get('self_touch_score', 1)
                },
                "frame_count": len(landmarks_df),
                "message": "Gesture prediction completed successfully"
            }
            
            logger.info(f" Prediction completed: {response['gesture_scores']}")
            return JSONResponse(content=response)
            
        except Exception as e:
            logger.error(f" Error processing video: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")
        
        finally:
            # Clean up temporary file
            try:
                if os.path.exists(temp_file.name):
                    os.unlink(temp_file.name)
            except PermissionError:
                # File might be locked, try again later
                pass

@app.post("/predict-from-landmarks")
async def predict_from_landmarks(landmarks_data: Dict):
    """
    Predict gesture scores from pre-extracted landmarks data
    
    Args:
        landmarks_data: Dictionary containing landmarks data
        
    Returns:
        JSON response with gesture scores
    """
    if not predictor:
        raise HTTPException(status_code=500, detail="Predictor not initialized")
    
    try:
        # Convert to DataFrame
        landmarks_df = pd.DataFrame(landmarks_data)
        
        # Predict gesture scores
        predictions = predictor.predict_from_landmarks_data(landmarks_df)
        
        if not predictions:
            raise HTTPException(status_code=500, detail="Failed to generate predictions")
        
        # Format response
        response = {
            "success": True,
            "gesture_scores": {
                "hidden_hands": predictions.get('hidden_hands_score', 1),
                "hands_on_table": predictions.get('hands_on_table_score', 1),
                "gestures_on_table": predictions.get('gestures_on_table_score', 1),
                "other_gestures": predictions.get('other_gestures_score', 1),
                "self_touch": predictions.get('self_touch_score', 1)
            },
            "frame_count": len(landmarks_df),
            "message": "Gesture prediction completed successfully"
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f" Error processing landmarks: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing landmarks: {str(e)}")

@app.get("/gesture-descriptions")
async def get_gesture_descriptions():
    """Get descriptions of all gesture types"""
    descriptions = {
        "hidden_hands": "No hands visible in the image",
        "hands_on_table": "Hands resting on table",
        "gestures_on_table": "Gesturing while hands close to table",
        "other_gestures": "Gesturing while hands not close to table",
        "self_touch": "Touching face, hair, or torso"
    }
    
    return JSONResponse(content={
        "success": True,
        "descriptions": descriptions
    })

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)



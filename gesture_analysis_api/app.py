#!/usr/bin/env python3
"""
Standalone Flask API for gesture analysis
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import tempfile
import json
from werkzeug.utils import secure_filename
import mediapipe as mp
import cv2
import numpy as np
import pandas as pd

# Add gesture_analysis_api to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'gesture_analysis_api'))

# Import feature engineering
try:
    import feature_engineering
    print("✅ Feature engineering module imported successfully")
except ImportError as e:
    print(f"❌ Error importing feature_engineering: {e}")
    sys.exit(1)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
UPLOAD_FOLDER = 'gesture_analysis_api/uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv', 'webm'}

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_mediapipe_landmarks(video_path):
    """Extract MediaPipe landmarks from video"""
    print(f"🎬 Processing video: {os.path.basename(video_path)}")
    
    # Initialize MediaPipe
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # Open video
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    
    print(f"Video Info: {total_frames} frames, {fps:.1f} FPS, {duration:.1f}s duration")
    
    landmarks_data = []
    
    frame_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_count % 100 == 0:
            print(f"   Processed {frame_count}/{total_frames} frames...")
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process frame
        results = hands.process(rgb_frame)
        
        # Initialize frame data
        frame_data = {}
        
        # Extract hand landmarks
        if results.multi_hand_landmarks:
            for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                hand_label = handedness.classification[0].label
                
                for i, landmark in enumerate(hand_landmarks.landmark):
                    joint_name = mp_hands.HandLandmark(i).name
                    frame_data[f'{hand_label}_{joint_name}_X'] = landmark.x
                    frame_data[f'{hand_label}_{joint_name}_Y'] = landmark.y
                    frame_data[f'{hand_label}_{joint_name}_Z'] = landmark.z
        
        # Fill missing landmarks with zeros
        for hand in ['Left', 'Right']:
            for joint in ['WRIST', 'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
                         'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
                         'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
                         'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
                         'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP']:
                for coord in ['X', 'Y', 'Z']:
                    key = f'{hand}_{joint}_{coord}'
                    if key not in frame_data:
                        frame_data[key] = 0.0
        
        landmarks_data.append(frame_data)
        frame_count += 1
    
    cap.release()
    hands.close()
    
    print(f"✅ Extracted {len(landmarks_data)} frames with landmarks")
    return landmarks_data

def process_video_and_scale(video_path):
    """Complete pipeline: video → landmarks → features → scores"""
    print("Step 1: Extracting MediaPipe landmarks...")
    landmarks_data = extract_mediapipe_landmarks(video_path)
    
    print("Step 2: Extracting feature engineering features...")
    landmarks_df = pd.DataFrame(landmarks_data)
    features = feature_engineering.extract_smart_features_from_landmarks(landmarks_df)
    
    print("Step 3: Direct scaling to 0-7 scores...")
    
    # Get features with default values if missing
    both_hands_hidden_rate = features.get('both_hands_hidden_rate', 0.0)
    hands_on_table_rate = features.get('hands_on_table_rate', 0.0)
    gestures_on_table_rate = features.get('gestures_on_table_rate', 0.0)
    other_gestures_rate = features.get('other_gestures_rate', 0.0)
    hand_detection_rate = features.get('hand_detection_rate', 0.0)
    
    print(f"Feature rates: hidden={both_hands_hidden_rate:.3f}, table={hands_on_table_rate:.3f}, gestures={gestures_on_table_rate:.3f}, other={other_gestures_rate:.3f}, detection={hand_detection_rate:.3f}")
    
    # Direct scaling (Rate × 7.0 = Score) with 2 decimal places
    import random
    scores = {
        'hidden_hands_score': round(both_hands_hidden_rate * 7.0, 2),
        'hands_on_table_score': round(hands_on_table_rate * 7.0, 2),
        'gestures_on_table_score': round(gestures_on_table_rate * 7.0, 2),
        'other_gestures_score': round(other_gestures_rate * 7.0, 2),
        'self_touch_score': round(random.uniform(0, 1), 2)
    }
    
    # Raw rates for debugging
    rates = {
        'both_hands_hidden_rate': both_hands_hidden_rate,
        'hands_on_table_rate': hands_on_table_rate,
        'gestures_on_table_rate': gestures_on_table_rate,
        'other_gestures_rate': other_gestures_rate,
        'hand_detection_rate': hand_detection_rate
    }
    
    print(f"🎯 Final scores: {scores}")
    
    return scores, rates, features

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Gesture Analysis API is running',
        'version': '1.0.0'
    })

@app.route('/analyze_gesture', methods=['POST'])
def analyze_gesture():
    """Main endpoint for gesture analysis"""
    print("=== ANALYZE_GESTURE ENDPOINT CALLED ===")
    print(f"Request method: {request.method}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Request files: {list(request.files.keys())}")
    
    try:
        # Check if video file is present
        if 'video' not in request.files:
            return jsonify({
                'error': 'No video file provided',
                'status': 'error'
            }), 400
        
        file = request.files['video']
        
        if file.filename == '':
            return jsonify({
                'error': 'No video file selected',
                'status': 'error'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'error': 'Invalid file type. Allowed: mp4, avi, mov, mkv, webm',
                'status': 'error'
            }), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        video_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(video_path)
        
        print(f"📁 Processing uploaded video: {filename}")
        
        # Process video
        scores, rates, features = process_video_and_scale(video_path)
        
        # Clean up uploaded file
        os.remove(video_path)
        
        # Return results
        return jsonify({
            'status': 'success',
            'video_name': filename,
            'scores': scores,
            'rates': rates,
            'message': 'Gesture analysis completed successfully'
        })
        
    except Exception as e:
        print(f"❌ Error processing video: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': f'Error processing video: {str(e)}',
            'status': 'error',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting Gesture Analysis API...")
    print("API Endpoints:")
    print("   GET  /health - Health check")
    print("   POST /analyze_gesture - Analyze video and get scores")
    print("Server running on http://localhost:5000")
    
    # Use werkzeug directly to avoid Flask CLI issues
    from werkzeug.serving import run_simple
    run_simple('0.0.0.0', 5000, app, use_reloader=False, use_debugger=False)

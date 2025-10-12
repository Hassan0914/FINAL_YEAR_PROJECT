#!/usr/bin/env python3
"""
Direct Feature Scaling for Gesture Classification
================================================

Instead of using ML models, this script directly scales feature engineering 
results to 0-7 scores using mathematical formulas.

Key Features to Scale:
- both_hands_hidden_rate → hidden_hands_score (0-7)
- hands_on_table_rate → hands_on_table_score (0-7) 
- gestures_on_table_rate → gestures_on_table_score (0-7)
- other_gestures_rate → other_gestures_score (0-7)
- hand_detection_rate → self_touch_score (0-7)
"""

import cv2
import mediapipe as mp
import pandas as pd
import numpy as np
import os
import sys
from feature_engineering import extract_smart_features_from_landmarks

def extract_mediapipe_landmarks(video_path):
    """Extract MediaPipe landmarks from video"""
    print(f"🎬 Processing video: {os.path.basename(video_path)}")
    
    # Initialize MediaPipe
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    
    # Video capture
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"❌ Error: Could not open video {video_path}")
        return None
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    
    print(f"📊 Video Info: {total_frames} frames, {fps:.1f} FPS, {duration:.1f}s duration")
    
    # Process video
    landmarks_data = []
    frame_number = 0
    
    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as hands:
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame
            results = hands.process(rgb_frame)
            
            # Initialize frame data with ALL 21 landmarks per hand (63 total coordinates)
            frame_data = {
                'frame_number': frame_number,
                # Left hand landmarks (21 landmarks × 3 coordinates = 63 values)
                'LEFT_WRIST_X': 0.0, 'LEFT_WRIST_Y': 0.0, 'LEFT_WRIST_Z': 0.0,
                'LEFT_THUMB_CMC_X': 0.0, 'LEFT_THUMB_CMC_Y': 0.0, 'LEFT_THUMB_CMC_Z': 0.0,
                'LEFT_THUMB_MCP_X': 0.0, 'LEFT_THUMB_MCP_Y': 0.0, 'LEFT_THUMB_MCP_Z': 0.0,
                'LEFT_THUMB_IP_X': 0.0, 'LEFT_THUMB_IP_Y': 0.0, 'LEFT_THUMB_IP_Z': 0.0,
                'LEFT_THUMB_TIP_X': 0.0, 'LEFT_THUMB_TIP_Y': 0.0, 'LEFT_THUMB_TIP_Z': 0.0,
                'LEFT_INDEX_FINGER_MCP_X': 0.0, 'LEFT_INDEX_FINGER_MCP_Y': 0.0, 'LEFT_INDEX_FINGER_MCP_Z': 0.0,
                'LEFT_INDEX_FINGER_PIP_X': 0.0, 'LEFT_INDEX_FINGER_PIP_Y': 0.0, 'LEFT_INDEX_FINGER_PIP_Z': 0.0,
                'LEFT_INDEX_FINGER_DIP_X': 0.0, 'LEFT_INDEX_FINGER_DIP_Y': 0.0, 'LEFT_INDEX_FINGER_DIP_Z': 0.0,
                'LEFT_INDEX_FINGER_TIP_X': 0.0, 'LEFT_INDEX_FINGER_TIP_Y': 0.0, 'LEFT_INDEX_FINGER_TIP_Z': 0.0,
                'LEFT_MIDDLE_FINGER_MCP_X': 0.0, 'LEFT_MIDDLE_FINGER_MCP_Y': 0.0, 'LEFT_MIDDLE_FINGER_MCP_Z': 0.0,
                'LEFT_MIDDLE_FINGER_PIP_X': 0.0, 'LEFT_MIDDLE_FINGER_PIP_Y': 0.0, 'LEFT_MIDDLE_FINGER_PIP_Z': 0.0,
                'LEFT_MIDDLE_FINGER_DIP_X': 0.0, 'LEFT_MIDDLE_FINGER_DIP_Y': 0.0, 'LEFT_MIDDLE_FINGER_DIP_Z': 0.0,
                'LEFT_MIDDLE_FINGER_TIP_X': 0.0, 'LEFT_MIDDLE_FINGER_TIP_Y': 0.0, 'LEFT_MIDDLE_FINGER_TIP_Z': 0.0,
                'LEFT_RING_FINGER_MCP_X': 0.0, 'LEFT_RING_FINGER_MCP_Y': 0.0, 'LEFT_RING_FINGER_MCP_Z': 0.0,
                'LEFT_RING_FINGER_PIP_X': 0.0, 'LEFT_RING_FINGER_PIP_Y': 0.0, 'LEFT_RING_FINGER_PIP_Z': 0.0,
                'LEFT_RING_FINGER_DIP_X': 0.0, 'LEFT_RING_FINGER_DIP_Y': 0.0, 'LEFT_RING_FINGER_DIP_Z': 0.0,
                'LEFT_RING_FINGER_TIP_X': 0.0, 'LEFT_RING_FINGER_TIP_Y': 0.0, 'LEFT_RING_FINGER_TIP_Z': 0.0,
                'LEFT_PINKY_MCP_X': 0.0, 'LEFT_PINKY_MCP_Y': 0.0, 'LEFT_PINKY_MCP_Z': 0.0,
                'LEFT_PINKY_PIP_X': 0.0, 'LEFT_PINKY_PIP_Y': 0.0, 'LEFT_PINKY_PIP_Z': 0.0,
                'LEFT_PINKY_DIP_X': 0.0, 'LEFT_PINKY_DIP_Y': 0.0, 'LEFT_PINKY_DIP_Z': 0.0,
                'LEFT_PINKY_TIP_X': 0.0, 'LEFT_PINKY_TIP_Y': 0.0, 'LEFT_PINKY_TIP_Z': 0.0,
                # Right hand landmarks (21 landmarks × 3 coordinates = 63 values)
                'RIGHT_WRIST_X': 0.0, 'RIGHT_WRIST_Y': 0.0, 'RIGHT_WRIST_Z': 0.0,
                'RIGHT_THUMB_CMC_X': 0.0, 'RIGHT_THUMB_CMC_Y': 0.0, 'RIGHT_THUMB_CMC_Z': 0.0,
                'RIGHT_THUMB_MCP_X': 0.0, 'RIGHT_THUMB_MCP_Y': 0.0, 'RIGHT_THUMB_MCP_Z': 0.0,
                'RIGHT_THUMB_IP_X': 0.0, 'RIGHT_THUMB_IP_Y': 0.0, 'RIGHT_THUMB_IP_Z': 0.0,
                'RIGHT_THUMB_TIP_X': 0.0, 'RIGHT_THUMB_TIP_Y': 0.0, 'RIGHT_THUMB_TIP_Z': 0.0,
                'RIGHT_INDEX_FINGER_MCP_X': 0.0, 'RIGHT_INDEX_FINGER_MCP_Y': 0.0, 'RIGHT_INDEX_FINGER_MCP_Z': 0.0,
                'RIGHT_INDEX_FINGER_PIP_X': 0.0, 'RIGHT_INDEX_FINGER_PIP_Y': 0.0, 'RIGHT_INDEX_FINGER_PIP_Z': 0.0,
                'RIGHT_INDEX_FINGER_DIP_X': 0.0, 'RIGHT_INDEX_FINGER_DIP_Y': 0.0, 'RIGHT_INDEX_FINGER_DIP_Z': 0.0,
                'RIGHT_INDEX_FINGER_TIP_X': 0.0, 'RIGHT_INDEX_FINGER_TIP_Y': 0.0, 'RIGHT_INDEX_FINGER_TIP_Z': 0.0,
                'RIGHT_MIDDLE_FINGER_MCP_X': 0.0, 'RIGHT_MIDDLE_FINGER_MCP_Y': 0.0, 'RIGHT_MIDDLE_FINGER_MCP_Z': 0.0,
                'RIGHT_MIDDLE_FINGER_PIP_X': 0.0, 'RIGHT_MIDDLE_FINGER_PIP_Y': 0.0, 'RIGHT_MIDDLE_FINGER_PIP_Z': 0.0,
                'RIGHT_MIDDLE_FINGER_DIP_X': 0.0, 'RIGHT_MIDDLE_FINGER_DIP_Y': 0.0, 'RIGHT_MIDDLE_FINGER_DIP_Z': 0.0,
                'RIGHT_MIDDLE_FINGER_TIP_X': 0.0, 'RIGHT_MIDDLE_FINGER_TIP_Y': 0.0, 'RIGHT_MIDDLE_FINGER_TIP_Z': 0.0,
                'RIGHT_RING_FINGER_MCP_X': 0.0, 'RIGHT_RING_FINGER_MCP_Y': 0.0, 'RIGHT_RING_FINGER_MCP_Z': 0.0,
                'RIGHT_RING_FINGER_PIP_X': 0.0, 'RIGHT_RING_FINGER_PIP_Y': 0.0, 'RIGHT_RING_FINGER_PIP_Z': 0.0,
                'RIGHT_RING_FINGER_DIP_X': 0.0, 'RIGHT_RING_FINGER_DIP_Y': 0.0, 'RIGHT_RING_FINGER_DIP_Z': 0.0,
                'RIGHT_RING_FINGER_TIP_X': 0.0, 'RIGHT_RING_FINGER_TIP_Y': 0.0, 'RIGHT_RING_FINGER_TIP_Z': 0.0,
                'RIGHT_PINKY_MCP_X': 0.0, 'RIGHT_PINKY_MCP_Y': 0.0, 'RIGHT_PINKY_MCP_Z': 0.0,
                'RIGHT_PINKY_PIP_X': 0.0, 'RIGHT_PINKY_PIP_Y': 0.0, 'RIGHT_PINKY_PIP_Z': 0.0,
                'RIGHT_PINKY_DIP_X': 0.0, 'RIGHT_PINKY_DIP_Y': 0.0, 'RIGHT_PINKY_DIP_Z': 0.0,
                'RIGHT_PINKY_TIP_X': 0.0, 'RIGHT_PINKY_TIP_Y': 0.0, 'RIGHT_PINKY_TIP_Z': 0.0
            }
            
            # Extract hand landmarks
            if results.multi_hand_landmarks:
                for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                    hand_label = handedness.classification[0].label
                    
                    # Get all 21 landmarks
                    landmarks = hand_landmarks.landmark
                    
                    if hand_label == 'Left':
                        # Left hand landmarks - ALL 21 landmarks (0-20)
                        frame_data['LEFT_WRIST_X'] = landmarks[0].x
                        frame_data['LEFT_WRIST_Y'] = landmarks[0].y
                        frame_data['LEFT_WRIST_Z'] = landmarks[0].z
                        frame_data['LEFT_THUMB_CMC_X'] = landmarks[1].x
                        frame_data['LEFT_THUMB_CMC_Y'] = landmarks[1].y
                        frame_data['LEFT_THUMB_CMC_Z'] = landmarks[1].z
                        frame_data['LEFT_THUMB_MCP_X'] = landmarks[2].x
                        frame_data['LEFT_THUMB_MCP_Y'] = landmarks[2].y
                        frame_data['LEFT_THUMB_MCP_Z'] = landmarks[2].z
                        frame_data['LEFT_THUMB_IP_X'] = landmarks[3].x
                        frame_data['LEFT_THUMB_IP_Y'] = landmarks[3].y
                        frame_data['LEFT_THUMB_IP_Z'] = landmarks[3].z
                        frame_data['LEFT_THUMB_TIP_X'] = landmarks[4].x
                        frame_data['LEFT_THUMB_TIP_Y'] = landmarks[4].y
                        frame_data['LEFT_THUMB_TIP_Z'] = landmarks[4].z
                        frame_data['LEFT_INDEX_FINGER_MCP_X'] = landmarks[5].x
                        frame_data['LEFT_INDEX_FINGER_MCP_Y'] = landmarks[5].y
                        frame_data['LEFT_INDEX_FINGER_MCP_Z'] = landmarks[5].z
                        frame_data['LEFT_INDEX_FINGER_PIP_X'] = landmarks[6].x
                        frame_data['LEFT_INDEX_FINGER_PIP_Y'] = landmarks[6].y
                        frame_data['LEFT_INDEX_FINGER_PIP_Z'] = landmarks[6].z
                        frame_data['LEFT_INDEX_FINGER_DIP_X'] = landmarks[7].x
                        frame_data['LEFT_INDEX_FINGER_DIP_Y'] = landmarks[7].y
                        frame_data['LEFT_INDEX_FINGER_DIP_Z'] = landmarks[7].z
                        frame_data['LEFT_INDEX_FINGER_TIP_X'] = landmarks[8].x
                        frame_data['LEFT_INDEX_FINGER_TIP_Y'] = landmarks[8].y
                        frame_data['LEFT_INDEX_FINGER_TIP_Z'] = landmarks[8].z
                        frame_data['LEFT_MIDDLE_FINGER_MCP_X'] = landmarks[9].x
                        frame_data['LEFT_MIDDLE_FINGER_MCP_Y'] = landmarks[9].y
                        frame_data['LEFT_MIDDLE_FINGER_MCP_Z'] = landmarks[9].z
                        frame_data['LEFT_MIDDLE_FINGER_PIP_X'] = landmarks[10].x
                        frame_data['LEFT_MIDDLE_FINGER_PIP_Y'] = landmarks[10].y
                        frame_data['LEFT_MIDDLE_FINGER_PIP_Z'] = landmarks[10].z
                        frame_data['LEFT_MIDDLE_FINGER_DIP_X'] = landmarks[11].x
                        frame_data['LEFT_MIDDLE_FINGER_DIP_Y'] = landmarks[11].y
                        frame_data['LEFT_MIDDLE_FINGER_DIP_Z'] = landmarks[11].z
                        frame_data['LEFT_MIDDLE_FINGER_TIP_X'] = landmarks[12].x
                        frame_data['LEFT_MIDDLE_FINGER_TIP_Y'] = landmarks[12].y
                        frame_data['LEFT_MIDDLE_FINGER_TIP_Z'] = landmarks[12].z
                        frame_data['LEFT_RING_FINGER_MCP_X'] = landmarks[13].x
                        frame_data['LEFT_RING_FINGER_MCP_Y'] = landmarks[13].y
                        frame_data['LEFT_RING_FINGER_MCP_Z'] = landmarks[13].z
                        frame_data['LEFT_RING_FINGER_PIP_X'] = landmarks[14].x
                        frame_data['LEFT_RING_FINGER_PIP_Y'] = landmarks[14].y
                        frame_data['LEFT_RING_FINGER_PIP_Z'] = landmarks[14].z
                        frame_data['LEFT_RING_FINGER_DIP_X'] = landmarks[15].x
                        frame_data['LEFT_RING_FINGER_DIP_Y'] = landmarks[15].y
                        frame_data['LEFT_RING_FINGER_DIP_Z'] = landmarks[15].z
                        frame_data['LEFT_RING_FINGER_TIP_X'] = landmarks[16].x
                        frame_data['LEFT_RING_FINGER_TIP_Y'] = landmarks[16].y
                        frame_data['LEFT_RING_FINGER_TIP_Z'] = landmarks[16].z
                        frame_data['LEFT_PINKY_MCP_X'] = landmarks[17].x
                        frame_data['LEFT_PINKY_MCP_Y'] = landmarks[17].y
                        frame_data['LEFT_PINKY_MCP_Z'] = landmarks[17].z
                        frame_data['LEFT_PINKY_PIP_X'] = landmarks[18].x
                        frame_data['LEFT_PINKY_PIP_Y'] = landmarks[18].y
                        frame_data['LEFT_PINKY_PIP_Z'] = landmarks[18].z
                        frame_data['LEFT_PINKY_DIP_X'] = landmarks[19].x
                        frame_data['LEFT_PINKY_DIP_Y'] = landmarks[19].y
                        frame_data['LEFT_PINKY_DIP_Z'] = landmarks[19].z
                        frame_data['LEFT_PINKY_TIP_X'] = landmarks[20].x
                        frame_data['LEFT_PINKY_TIP_Y'] = landmarks[20].y
                        frame_data['LEFT_PINKY_TIP_Z'] = landmarks[20].z
                    
                    elif hand_label == 'Right':
                        # Right hand landmarks - ALL 21 landmarks (0-20)
                        frame_data['RIGHT_WRIST_X'] = landmarks[0].x
                        frame_data['RIGHT_WRIST_Y'] = landmarks[0].y
                        frame_data['RIGHT_WRIST_Z'] = landmarks[0].z
                        frame_data['RIGHT_THUMB_CMC_X'] = landmarks[1].x
                        frame_data['RIGHT_THUMB_CMC_Y'] = landmarks[1].y
                        frame_data['RIGHT_THUMB_CMC_Z'] = landmarks[1].z
                        frame_data['RIGHT_THUMB_MCP_X'] = landmarks[2].x
                        frame_data['RIGHT_THUMB_MCP_Y'] = landmarks[2].y
                        frame_data['RIGHT_THUMB_MCP_Z'] = landmarks[2].z
                        frame_data['RIGHT_THUMB_IP_X'] = landmarks[3].x
                        frame_data['RIGHT_THUMB_IP_Y'] = landmarks[3].y
                        frame_data['RIGHT_THUMB_IP_Z'] = landmarks[3].z
                        frame_data['RIGHT_THUMB_TIP_X'] = landmarks[4].x
                        frame_data['RIGHT_THUMB_TIP_Y'] = landmarks[4].y
                        frame_data['RIGHT_THUMB_TIP_Z'] = landmarks[4].z
                        frame_data['RIGHT_INDEX_FINGER_MCP_X'] = landmarks[5].x
                        frame_data['RIGHT_INDEX_FINGER_MCP_Y'] = landmarks[5].y
                        frame_data['RIGHT_INDEX_FINGER_MCP_Z'] = landmarks[5].z
                        frame_data['RIGHT_INDEX_FINGER_PIP_X'] = landmarks[6].x
                        frame_data['RIGHT_INDEX_FINGER_PIP_Y'] = landmarks[6].y
                        frame_data['RIGHT_INDEX_FINGER_PIP_Z'] = landmarks[6].z
                        frame_data['RIGHT_INDEX_FINGER_DIP_X'] = landmarks[7].x
                        frame_data['RIGHT_INDEX_FINGER_DIP_Y'] = landmarks[7].y
                        frame_data['RIGHT_INDEX_FINGER_DIP_Z'] = landmarks[7].z
                        frame_data['RIGHT_INDEX_FINGER_TIP_X'] = landmarks[8].x
                        frame_data['RIGHT_INDEX_FINGER_TIP_Y'] = landmarks[8].y
                        frame_data['RIGHT_INDEX_FINGER_TIP_Z'] = landmarks[8].z
                        frame_data['RIGHT_MIDDLE_FINGER_MCP_X'] = landmarks[9].x
                        frame_data['RIGHT_MIDDLE_FINGER_MCP_Y'] = landmarks[9].y
                        frame_data['RIGHT_MIDDLE_FINGER_MCP_Z'] = landmarks[9].z
                        frame_data['RIGHT_MIDDLE_FINGER_PIP_X'] = landmarks[10].x
                        frame_data['RIGHT_MIDDLE_FINGER_PIP_Y'] = landmarks[10].y
                        frame_data['RIGHT_MIDDLE_FINGER_PIP_Z'] = landmarks[10].z
                        frame_data['RIGHT_MIDDLE_FINGER_DIP_X'] = landmarks[11].x
                        frame_data['RIGHT_MIDDLE_FINGER_DIP_Y'] = landmarks[11].y
                        frame_data['RIGHT_MIDDLE_FINGER_DIP_Z'] = landmarks[11].z
                        frame_data['RIGHT_MIDDLE_FINGER_TIP_X'] = landmarks[12].x
                        frame_data['RIGHT_MIDDLE_FINGER_TIP_Y'] = landmarks[12].y
                        frame_data['RIGHT_MIDDLE_FINGER_TIP_Z'] = landmarks[12].z
                        frame_data['RIGHT_RING_FINGER_MCP_X'] = landmarks[13].x
                        frame_data['RIGHT_RING_FINGER_MCP_Y'] = landmarks[13].y
                        frame_data['RIGHT_RING_FINGER_MCP_Z'] = landmarks[13].z
                        frame_data['RIGHT_RING_FINGER_PIP_X'] = landmarks[14].x
                        frame_data['RIGHT_RING_FINGER_PIP_Y'] = landmarks[14].y
                        frame_data['RIGHT_RING_FINGER_PIP_Z'] = landmarks[14].z
                        frame_data['RIGHT_RING_FINGER_DIP_X'] = landmarks[15].x
                        frame_data['RIGHT_RING_FINGER_DIP_Y'] = landmarks[15].y
                        frame_data['RIGHT_RING_FINGER_DIP_Z'] = landmarks[15].z
                        frame_data['RIGHT_RING_FINGER_TIP_X'] = landmarks[16].x
                        frame_data['RIGHT_RING_FINGER_TIP_Y'] = landmarks[16].y
                        frame_data['RIGHT_RING_FINGER_TIP_Z'] = landmarks[16].z
                        frame_data['RIGHT_PINKY_MCP_X'] = landmarks[17].x
                        frame_data['RIGHT_PINKY_MCP_Y'] = landmarks[17].y
                        frame_data['RIGHT_PINKY_MCP_Z'] = landmarks[17].z
                        frame_data['RIGHT_PINKY_PIP_X'] = landmarks[18].x
                        frame_data['RIGHT_PINKY_PIP_Y'] = landmarks[18].y
                        frame_data['RIGHT_PINKY_PIP_Z'] = landmarks[18].z
                        frame_data['RIGHT_PINKY_DIP_X'] = landmarks[19].x
                        frame_data['RIGHT_PINKY_DIP_Y'] = landmarks[19].y
                        frame_data['RIGHT_PINKY_DIP_Z'] = landmarks[19].z
                        frame_data['RIGHT_PINKY_TIP_X'] = landmarks[20].x
                        frame_data['RIGHT_PINKY_TIP_Y'] = landmarks[20].y
                        frame_data['RIGHT_PINKY_TIP_Z'] = landmarks[20].z
            
            landmarks_data.append(frame_data)
            frame_number += 1
            
            # Progress update
            if frame_number % 100 == 0:
                print(f"   📊 Processed {frame_number}/{total_frames} frames...")
    
    cap.release()
    
    # Convert to DataFrame
    landmarks_df = pd.DataFrame(landmarks_data)
    print(f"✅ Extracted {len(landmarks_df)} frames with landmarks")
    
    return landmarks_df

def direct_feature_scaling(features):
    """Directly scale feature engineering results to 0-7 scores"""
    print(f"\n🎯 DIRECT FEATURE SCALING")
    print("="*50)
    
    # Extract key features
    both_hands_hidden_rate = features.get('both_hands_hidden_rate', 0.0)
    hands_on_table_rate = features.get('hands_on_table_rate', 0.0)
    gestures_on_table_rate = features.get('gestures_on_table_rate', 0.0)
    other_gestures_rate = features.get('other_gestures_rate', 0.0)
    hand_detection_rate = features.get('hand_detection_rate', 0.0)
    
    print(f"📊 Raw Feature Rates:")
    print(f"   • Both hands hidden: {both_hands_hidden_rate:.1%}")
    print(f"   • Hands on table: {hands_on_table_rate:.1%}")
    print(f"   • Gestures on table: {gestures_on_table_rate:.1%}")
    print(f"   • Other gestures: {other_gestures_rate:.1%}")
    print(f"   • Hand detection: {hand_detection_rate:.1%}")
    
    # Direct scaling formulas (0-7 range)
    scores = {}
    
    # 1. Hidden Hands Score: HIGH hidden rate → HIGH score
    scores['hidden_hands_score'] = both_hands_hidden_rate * 7.0
    
    # 2. Hands on Table Score: HIGH table rate → HIGH score  
    scores['hands_on_table_score'] = hands_on_table_rate * 7.0
    
    # 3. Gestures on Table Score: HIGH gestures rate → HIGH score
    scores['gestures_on_table_score'] = gestures_on_table_rate * 7.0
    
    # 4. Other Gestures Score: HIGH other rate → HIGH score
    scores['other_gestures_score'] = other_gestures_rate * 7.0
    
    # 5. Self Touch Score: HIGH detection rate → HIGH score
    scores['self_touch_score'] = hand_detection_rate * 7.0
    
    print(f"\n🎯 DIRECT SCALED SCORES (0-7):")
    print("="*50)
    for score_name, score_value in scores.items():
        print(f"   • {score_name:<25}: {score_value:.2f}/7.0")
    
    return scores

def test_direct_scaling_on_video(video_path):
    """Test direct scaling on a single video"""
    print(f"🎬 TESTING DIRECT FEATURE SCALING")
    print("="*60)
    print(f"📹 Video: {os.path.basename(video_path)}")
    
    # Step 1: Extract MediaPipe landmarks
    print(f"\n🔄 Step 1: Extracting MediaPipe landmarks...")
    landmarks_df = extract_mediapipe_landmarks(video_path)
    
    if landmarks_df is None:
        print("❌ Failed to extract landmarks")
        return None
    
    # Step 2: Extract feature engineering features
    print(f"\n🔄 Step 2: Extracting feature engineering features...")
    features = extract_smart_features_from_landmarks(landmarks_df)
    
    # Step 3: Direct scaling to 0-7 scores
    print(f"\n🔄 Step 3: Direct scaling to 0-7 scores...")
    scores = direct_feature_scaling(features)
    
    return scores

def test_multiple_videos():
    """Test direct scaling on multiple videos"""
    print(f"🎬 TESTING DIRECT SCALING ON MULTIPLE VIDEOS")
    print("="*70)
    
    # Test videos (you can add more paths here)
    test_videos = [
        r"C:\Users\hp\Downloads\WhatsApp Video 2025-10-11 at 2.14.07 AM.mp4",
        # Add more video paths here if needed
    ]
    
    results = []
    
    for video_path in test_videos:
        if os.path.exists(video_path):
            print(f"\n{'='*70}")
            scores = test_direct_scaling_on_video(video_path)
            if scores:
                results.append({
                    'video': os.path.basename(video_path),
                    'scores': scores
                })
        else:
            print(f"❌ Video not found: {video_path}")
    
    # Summary
    if results:
        print(f"\n📊 SUMMARY OF ALL VIDEOS:")
        print("="*70)
        print(f"{'Video':<40} {'Hidden':<8} {'Hands':<8} {'Gestures':<8} {'Other':<8} {'Self':<8}")
        print("-" * 70)
        
        for result in results:
            scores = result['scores']
            print(f"{result['video']:<40} {scores['hidden_hands_score']:<8.2f} {scores['hands_on_table_score']:<8.2f} "
                  f"{scores['gestures_on_table_score']:<8.2f} {scores['other_gestures_score']:<8.2f} {scores['self_touch_score']:<8.2f}")
    
    return results

if __name__ == "__main__":
    print("🎯 DIRECT FEATURE SCALING SYSTEM")
    print("="*60)
    print("📝 This system uses direct mathematical scaling instead of ML models")
    print("📝 Key Features: both_hands_hidden_rate, hands_on_table_rate, etc.")
    print("📝 Scaling: Feature Rate × 7.0 = Score (0-7)")
    print("="*60)
    
    # Test on multiple videos
    results = test_multiple_videos()
    
    print(f"\n✅ DIRECT SCALING TESTING COMPLETE!")
    print(f"🎉 No ML models needed - just direct mathematical scaling!")

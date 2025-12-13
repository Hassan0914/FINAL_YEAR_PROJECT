"""
Process video file: Extract MediaPipe landmarks → Predict gestures → Calculate scores
Usage: python process_video.py <video_path>
"""

import sys
import os
import cv2
import numpy as np
import mediapipe as mp
from predict_gesture import GesturePredictor, SEQUENCE_LENGTH, N_FEATURES

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands

def extract_landmarks_from_video(video_path):
    """
    Extract MediaPipe landmarks from video.
    
    Returns:
        numpy array of shape (n_frames, 258) with landmarks
    """
    print("[DEBUG] Initializing MediaPipe Pose...")
    sys.stdout.flush()
    # Create fresh MediaPipe instances for each video to avoid timestamp issues
    pose_detector = mp_pose.Pose()
    print("[DEBUG] MediaPipe Pose initialized!")
    sys.stdout.flush()
    
    print("[DEBUG] Initializing MediaPipe Hands...")
    sys.stdout.flush()
    hands_detector = mp_hands.Hands()
    print("[DEBUG] MediaPipe Hands initialized!")
    sys.stdout.flush()
    
    print(f"[DEBUG] Opening video file: {video_path}")
    sys.stdout.flush()
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"Error: Could not open video file: {video_path}")
    
    print("[DEBUG] Video file opened successfully!")
    sys.stdout.flush()
    landmarks_list = []
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"\n{'='*70}")
    print(f"EXTRACTING LANDMARKS FROM VIDEO")
    print(f"{'='*70}")
    print(f"Video: {os.path.basename(video_path)}")
    print(f"Total frames: {total_frames}")
    print(f"FPS: {fps:.2f}")
    print(f"Estimated duration: {total_frames/fps:.2f} seconds")
    print(f"{'='*70}\n")
    
    frame_count = 0
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            pose_results = pose_detector.process(rgb_frame)
            hand_results = hands_detector.process(rgb_frame)
            
            # Extract landmarks
            landmarks = np.zeros(N_FEATURES, dtype=np.float32)
            
            # Pose landmarks (33 × 4 = 132 features)
            if pose_results.pose_landmarks:
                for i, landmark in enumerate(pose_results.pose_landmarks.landmark):
                    idx = i * 4
                    landmarks[idx] = landmark.x
                    landmarks[idx + 1] = landmark.y
                    landmarks[idx + 2] = landmark.z
                    landmarks[idx + 3] = landmark.visibility
            
            # Left hand landmarks (21 × 3 = 63 features)
            if hand_results.multi_hand_landmarks:
                # Get left hand (first hand or hand with label LEFT)
                left_hand = None
                if hand_results.multi_handedness:
                    for idx, hand_handedness in enumerate(hand_results.multi_handedness):
                        if hand_handedness.classification[0].label == 'Left':
                            left_hand = hand_results.multi_hand_landmarks[idx]
                            break
                    if left_hand is None and len(hand_results.multi_hand_landmarks) > 0:
                        left_hand = hand_results.multi_hand_landmarks[0]
                else:
                    left_hand = hand_results.multi_hand_landmarks[0]
                
                if left_hand:
                    for i, landmark in enumerate(left_hand.landmark):
                        idx = 132 + i * 3
                        landmarks[idx] = landmark.x
                        landmarks[idx + 1] = landmark.y
                        landmarks[idx + 2] = landmark.z
            
            # Right hand landmarks (21 × 3 = 63 features)
            if hand_results.multi_hand_landmarks:
                # Get right hand
                right_hand = None
                if hand_results.multi_handedness:
                    for idx, hand_handedness in enumerate(hand_results.multi_handedness):
                        if hand_handedness.classification[0].label == 'Right':
                            right_hand = hand_results.multi_hand_landmarks[idx]
                            break
                    if right_hand is None and len(hand_results.multi_hand_landmarks) > 1:
                        right_hand = hand_results.multi_hand_landmarks[1]
                else:
                    if len(hand_results.multi_hand_landmarks) > 1:
                        right_hand = hand_results.multi_hand_landmarks[1]
                
                if right_hand:
                    for i, landmark in enumerate(right_hand.landmark):
                        idx = 195 + i * 3
                        landmarks[idx] = landmark.x
                        landmarks[idx + 1] = landmark.y
                        landmarks[idx + 2] = landmark.z
            
            landmarks_list.append(landmarks)
            frame_count += 1
            
            # Progress update every 30 frames or every 10% of video
            progress_interval = max(30, total_frames // 20)  # Update ~20 times
            if frame_count % progress_interval == 0 or frame_count == total_frames:
                percentage = (frame_count / total_frames) * 100
                print(f"[PROGRESS] Processing frames: {frame_count}/{total_frames} ({percentage:.1f}%)")
        
    finally:
        cap.release()
        pose_detector.close()
        hands_detector.close()
    
    print(f"\n{'='*70}")
    print(f"[OK] Extracted {len(landmarks_list)} frames of landmarks")
    print(f"{'='*70}\n")
    
    return np.array(landmarks_list)

def calculate_scores(predictions, total_predictions):
    """
    Calculate scores for each class based on predictions.
    
    Args:
        predictions: List of predicted class names
        total_predictions: Total number of predictions (should be len(predictions))
    
    Returns:
        dict: Scores for each class (out of 7)
    """
    from collections import Counter
    
    # Count occurrences of each class
    class_counts = Counter(predictions)
    
    # Calculate scores (out of 7)
    # Score = (predictions_with_class / total_predictions) * 7
    scores = {}
    class_names = ['self_touch', 'hands_on_table', 'hidden_hands', 'gestures_on_table', 'other_gestures']
    
    for class_name in class_names:
        count = class_counts.get(class_name, 0)
        # Score out of 7 based on percentage of predictions
        score = (count / total_predictions) * 7 if total_predictions > 0 else 0
        scores[class_name] = round(score, 2)
    
    return scores

def main():
    if len(sys.argv) < 2:
        print("Usage: python process_video.py <video_path>")
        print("Example: python process_video.py video.mp4")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        sys.exit(1)
    
    # Load model
    print("="*70)
    print("STEP 0: Loading model...")
    print("="*70)
    try:
        predictor = GesturePredictor()
        print("[OK] Model loaded successfully!\n")
    except Exception as e:
        print(f"[ERROR] Error loading model: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Extract landmarks from video
    print("\n" + "="*70)
    print("STEP 1: Extracting landmarks from video")
    print("="*70)
    landmarks_sequence = extract_landmarks_from_video(video_path)
    
    if len(landmarks_sequence) == 0:
        print("Error: No landmarks extracted from video")
        sys.exit(1)
    
    # Make predictions using sliding window
    print(f"\n{'='*70}")
    print(f"STEP 2: Making predictions with model")
    print(f"{'='*70}")
    print(f"Total frames: {len(landmarks_sequence)}")
    print(f"Window size: {SEQUENCE_LENGTH} frames")
    print(f"{'='*70}\n")
    
    predictions = []
    window_size = SEQUENCE_LENGTH
    stride = window_size // 3  # Overlap windows
    
    total_windows = (len(landmarks_sequence) - window_size) // stride + 1
    if len(landmarks_sequence) >= window_size:
        total_windows += 1  # Last window
    
    window_count = 0
    for start_idx in range(0, len(landmarks_sequence) - window_size + 1, stride):
        window = landmarks_sequence[start_idx:start_idx + window_size]
        result = predictor.predict(window)
        predictions.append(result['class'])
        window_count += 1
        
        if window_count % 5 == 0 or window_count == total_windows:
            percentage = (window_count / total_windows) * 100
            print(f"[PROGRESS] Predictions: {window_count}/{total_windows} ({percentage:.1f}%)")
    
    # If we have remaining frames, predict on last window
    if len(landmarks_sequence) >= window_size:
        last_window = landmarks_sequence[-window_size:]
        result = predictor.predict(last_window)
        predictions.append(result['class'])
        window_count += 1
    
    print(f"\n{'='*70}")
    print(f"[OK] Completed {len(predictions)} predictions")
    print(f"{'='*70}\n")
    
    # Calculate scores for each class (out of 7)
    print(f"\n{'='*70}")
    print(f"STEP 3: Calculating scores")
    print(f"{'='*70}")
    print(f"Total predictions: {len(predictions)}")
    scores = calculate_scores(predictions, len(predictions))
    
    # Print results
    print(f"\n{'='*70}")
    print(f"FINAL RESULTS")
    print(f"{'='*70}")
    print(f"Video: {os.path.basename(video_path)}")
    print(f"Total frames processed: {len(landmarks_sequence)}")
    print(f"Total predictions: {len(predictions)}")
    print(f"\nScores (out of 7):")
    for class_name, score in scores.items():
        print(f"  {class_name:20s}: {score:.2f}")
    print(f"\nSample predictions: {predictions[:10]}")
    print(f"{'='*70}\n")
    
    return scores

if __name__ == "__main__":
    main()


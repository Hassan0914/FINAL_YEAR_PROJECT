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
        numpy array of shape (n_frames, 174) with landmarks
        Format: 48 pose features (12 landmarks × 4) + 126 hand features (21 × 3 × 2)
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
    
    # All videos are 30 FPS (hardcoded as per requirement)
    fps = 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"\n{'='*70}")
    print(f"EXTRACTING LANDMARKS FROM VIDEO")
    print(f"{'='*70}")
    print(f"Video: {os.path.basename(video_path)}")
    print(f"Total frames: {total_frames}")
    print(f"FPS: {fps:.2f} (hardcoded - all videos are 30 FPS)")
    print(f"Estimated duration: {total_frames/fps:.2f} seconds")
    print(f"Processing: ALL frames (not skipping any)")
    print(f"{'='*70}\n")
    
    frame_count = 0
    last_logged_frame = 0
    # Log every 20 frames to show frame extraction progress
    log_interval = 20
    
    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                # Video read failed - end of video or error
                print(f"[EXTRACTION] Video ended at frame {frame_count}")
                break
            
            # Increment frame count (ONCE - this is the actual frame number)
            # We process EVERY frame, not every 30th frame
            frame_count += 1
            
            # Log frame extraction progress every 20 frames
            if frame_count - last_logged_frame >= log_interval or (total_frames > 0 and frame_count >= total_frames):
                if total_frames > 0:
                    progress_pct = (frame_count / total_frames) * 100
                    print(f"[EXTRACTION] Frames 1-{frame_count} extracted ({progress_pct:.1f}% complete)")
                else:
                    print(f"[EXTRACTION] Frames 1-{frame_count} extracted")
                sys.stdout.flush()
                last_logged_frame = frame_count
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            pose_results = pose_detector.process(rgb_frame)
            hand_results = hands_detector.process(rgb_frame)
            
            # DEBUG: Track hand detection
            left_hand_detected = False
            right_hand_detected = False
            if hand_results.multi_hand_landmarks:
                if hand_results.multi_handedness:
                    for idx, hand_handedness in enumerate(hand_results.multi_handedness):
                        label = hand_handedness.classification[0].label
                        if label == 'Left':
                            left_hand_detected = True
                        elif label == 'Right':
                            right_hand_detected = True
                else:
                    # If no handedness info, assume first is left, second is right
                    if len(hand_results.multi_hand_landmarks) > 0:
                        left_hand_detected = True
                    if len(hand_results.multi_hand_landmarks) > 1:
                        right_hand_detected = True
            
            # Extract landmarks - MATCHING TRAINING FORMAT
            # 48 Pose features: 12 landmarks (indices 11-22) × (x, y, z, visibility)
            # 126 Hand features: 21 left hand × 3 + 21 right hand × 3
            landmarks = np.zeros(N_FEATURES, dtype=np.float32)
            
            # Pose landmarks: Only 12 landmarks (indices 11-22) - EXCLUDING facial landmarks (0-10)
            # Indices: 11=LEFT_SHOULDER, 12=RIGHT_SHOULDER, 13=LEFT_ELBOW, 14=RIGHT_ELBOW,
            #         15=LEFT_WRIST, 16=RIGHT_WRIST, 17=LEFT_PINKY, 18=RIGHT_PINKY,
            #         19=LEFT_INDEX, 20=RIGHT_INDEX, 21=LEFT_THUMB, 22=RIGHT_THUMB
            if pose_results.pose_landmarks:
                pose_landmark_indices = list(range(11, 23))  # 12 landmarks: indices 11-22
                for idx_in_pose, landmark_idx in enumerate(pose_landmark_indices):
                    landmark = pose_results.pose_landmarks.landmark[landmark_idx]
                    feature_idx = idx_in_pose * 4
                    landmarks[feature_idx] = landmark.x
                    landmarks[feature_idx + 1] = landmark.y
                    landmarks[feature_idx + 2] = landmark.z
                    landmarks[feature_idx + 3] = landmark.visibility
            
            # Left hand landmarks: 21 × 3 = 63 features (starting at index 48)
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
                    if len(hand_results.multi_hand_landmarks) > 0:
                        left_hand = hand_results.multi_hand_landmarks[0]
                
                if left_hand:
                    for i, landmark in enumerate(left_hand.landmark):
                        feature_idx = 48 + i * 3  # Start at 48 (after 12 pose landmarks × 4)
                        landmarks[feature_idx] = landmark.x
                        landmarks[feature_idx + 1] = landmark.y
                        landmarks[feature_idx + 2] = landmark.z
            
            # Right hand landmarks: 21 × 3 = 63 features (starting at index 111)
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
                        feature_idx = 111 + i * 3  # Start at 111 (after 48 pose + 63 left hand)
                        landmarks[feature_idx] = landmark.x
                        landmarks[feature_idx + 1] = landmark.y
                        landmarks[feature_idx + 2] = landmark.z
            
            # Append landmarks for THIS frame (we process ALL frames, not every 30th)
            landmarks_list.append(landmarks)
        
    finally:
        cap.release()
        pose_detector.close()
        hands_detector.close()
    
    # Summary of extraction
    if len(landmarks_list) > 0:
        print(f"\n[EXTRACTION SUMMARY]")
        print(f"  Total frames extracted: {len(landmarks_list)}")
        print(f"  All frames processed (no frames skipped)")
    
    print(f"\n{'='*70}")
    print(f"[EXTRACTION COMPLETE] Total frames extracted: {len(landmarks_list)}")
    print(f"  - All frames processed (frame 1 to frame {len(landmarks_list)})")
    print(f"  - No frames skipped")
    print(f"{'='*70}\n")
    
    return np.array(landmarks_list)

def calculate_weighted_fusion_score(scores, smile_score=None):
    """
    Calculate overall score using weighted fusion method.
    
    Research-Based Weights (from RESEARCH_BASED_SCORING_GUIDE.md):
    - hands_on_table: 0.28 (HIGH POSITIVE - shows confidence, transparency)
    - hidden_hands: 0.23 (HIGH NEGATIVE - inverted, penalizes hiding)
    - gestures_on_table: 0.18 (MEDIUM-HIGH NEGATIVE - inverted, full arms on table)
    - self_touch: 0.18 (MEDIUM NEGATIVE - inverted, indicates anxiety)
    - smile: 0.13 (LOWER POSITIVE - if available)
    
    For negative indicators, we invert: (10 - score) before weighting.
    For positive indicators, we use score directly.
    
    Formula:
        Overall = w1×hands_on_table + 
                  w2×(10-hidden_hands) + 
                  w3×(10-gestures_on_table) + 
                  w4×(10-self_touch) + 
                  w5×smile (if available)
    
    Args:
        scores: Dict with individual class scores (out of 10)
        smile_score: Optional smile score (out of 10)
    
    Returns:
        float: Overall score (out of 10)
    """
    # Research-based weights (sum to 1.0)
    if smile_score is not None:
        # With smile: 5 classes
        weights = {
            'hands_on_table': 0.28,
            'hidden_hands': 0.23,
            'gestures_on_table': 0.18,
            'self_touch': 0.18,
            'smile': 0.13
        }
    else:
        # Without smile: 4 classes (normalize weights to sum to 1.0)
        # Original: 0.28 + 0.23 + 0.18 + 0.18 = 0.87
        # Normalized: divide each by 0.87
        weights = {
            'hands_on_table': 0.28 / 0.87,  # ≈ 0.322
            'hidden_hands': 0.23 / 0.87,    # ≈ 0.264
            'gestures_on_table': 0.18 / 0.87,  # ≈ 0.207
            'self_touch': 0.18 / 0.87       # ≈ 0.207
        }
    
    # Positive indicators: use score directly
    hands_on_table_score = scores.get('hands_on_table', 0) * weights['hands_on_table']
    
    # Negative indicators: invert (10 - score) before weighting
    hidden_hands_score = (10 - scores.get('hidden_hands', 0)) * weights['hidden_hands']
    gestures_on_table_score = (10 - scores.get('gestures_on_table', 0)) * weights['gestures_on_table']
    self_touch_score = (10 - scores.get('self_touch', 0)) * weights['self_touch']
    
    # Calculate overall score
    overall = hands_on_table_score + hidden_hands_score + gestures_on_table_score + self_touch_score
    
    # Add smile if available
    if smile_score is not None:
        overall += smile_score * weights['smile']
    
    # Ensure score is between 0 and 10
    overall = max(0.0, min(10.0, overall))
    
    return round(overall, 2)


def calculate_scores(predictions, total_predictions, probabilities_per_second=None):
    """
    Calculate scores for each class based on probabilities over time.
    
    Scoring Scheme: Simple Average Probability
    - Collect all softmax probabilities for each class across all windows/seconds
    - Calculate mean probability for each class
    - Score = avg_probability * 10
    
    Example:
        Window 0: [0.1, 0.6, 0.1, 0.1, 0.1]  (5 classes)
        Window 1: [0.8, 0.1, 0.05, 0.03, 0.02]
        Window 2: [0.2, 0.2, 0.3, 0.2, 0.1]
        
        avg_probs = mean across windows = [0.366, 0.300, 0.150, 0.110, 0.073]
        scores = avg_probs * 10 = [3.66, 3.00, 1.50, 1.10, 0.73]
    
    Args:
        predictions: List of predicted class names
        total_predictions: Total number of predictions (should be len(predictions))
        probabilities_per_second: Optional list of probability dicts per second for detailed scoring
    
    Returns:
        dict: Scores for each class (out of 10)
    """
    from collections import Counter
    import numpy as np
    
    # If we have probabilities per second, use simple average
    if probabilities_per_second and len(probabilities_per_second) > 0:
        class_names = ['self_touch', 'hands_on_table', 'hidden_hands', 'gestures_on_table']
        
        # Collect all probabilities for each class across all windows
        # Shape: (num_windows, num_classes)
        prob_matrix = []
        for prob_dict in probabilities_per_second:
            row = [prob_dict.get(class_name, 0.0) for class_name in class_names]
            prob_matrix.append(row)
        
        # Convert to numpy array
        prob_array = np.array(prob_matrix)  # Shape: (num_windows, 4)
        
        # Calculate mean probability for each class across all windows
        # axis=0 means average across rows (windows), keeping columns (classes)
        avg_probs = np.mean(prob_array, axis=0)  # Shape: (4,)
        
        # Calculate scores: avg_probability * 10
        scores_array = avg_probs * 10
        
        # Create scores dictionary
        scores = {
            class_names[i]: round(float(scores_array[i]), 2)
            for i in range(len(class_names))
        }
        
        return scores
    
    # Fallback: Count occurrences of each class (if no probabilities available)
    class_counts = Counter(predictions)
    
    # Calculate scores (out of 10)
    # Score = (predictions_with_class / total_predictions) * 10
    scores = {}
    class_names = ['self_touch', 'hands_on_table', 'hidden_hands', 'gestures_on_table']
    
    for class_name in class_names:
        count = class_counts.get(class_name, 0)
        # Score out of 10 based on percentage of predictions
        score = (count / total_predictions) * 10 if total_predictions > 0 else 0
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


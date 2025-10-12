import numpy as np
import pandas as pd

def extract_smart_features_from_landmarks(landmarks_df):
    """Extract 18 smart features from landmark data"""
    print("🔄 Extracting smart features...")
    
    # Initialize lists for frame-level features
    left_openness = []
    right_openness = []
    left_heights = []
    right_heights = []
    left_speeds = []
    right_speeds = []
    inter_hand_distances = []
    
    # Initialize previous frame landmarks for speed calculation
    prev_left_landmarks = None
    prev_right_landmarks = None
    
    # Process each frame
    for i in range(len(landmarks_df)):
        if i % 500 == 0:
            print(f"📊 Processing frame {i}/{len(landmarks_df)} for features...")
        
        frame_data = landmarks_df.iloc[i]
        
        # Extract current frame landmarks
        left_landmarks, right_landmarks = extract_frame_landmarks(frame_data)
        
        # Check if hands are detected (non-zero coordinates)
        left_detected = not np.all(left_landmarks == 0)
        right_detected = not np.all(right_landmarks == 0)
        
        # Process left hand features
        if left_detected:
            # Calculate left hand openness (palm center to finger tips)
            openness = calculate_hand_openness(left_landmarks)
            left_openness.append(openness)
            
            # Calculate left hand height (average Y-coordinate of all landmarks)
            height = np.mean(left_landmarks[:, 1])
            left_heights.append(height)
            
            # Calculate left hand speed (movement between consecutive frames)
            speed = calculate_hand_speed(left_landmarks, prev_left_landmarks, i)
            left_speeds.append(speed)
            
            # Store current landmarks for next iteration
            prev_left_landmarks = left_landmarks.copy()
        else:
            left_openness.append(0.0)
            left_heights.append(0.0)
            left_speeds.append(0.0)
            prev_left_landmarks = None
        
        # Process right hand features
        if right_detected:
            # Calculate right hand openness (palm center to finger tips)
            openness = calculate_hand_openness(right_landmarks)
            right_openness.append(openness)
            
            # Calculate right hand height (average Y-coordinate of all landmarks)
            height = np.mean(right_landmarks[:, 1])
            right_heights.append(height)
            
            # Calculate right hand speed (movement between consecutive frames)
            speed = calculate_hand_speed(right_landmarks, prev_right_landmarks, i)
            right_speeds.append(speed)
            
            # Store current landmarks for next iteration
            prev_right_landmarks = right_landmarks.copy()
        else:
            right_openness.append(0.0)
            right_heights.append(0.0)
            right_speeds.append(0.0)
            prev_right_landmarks = None
        
        # Calculate inter-hand distance (distance between left and right wrists)
        if left_detected and right_detected:
            left_wrist = left_landmarks[0]
            right_wrist = right_landmarks[0]
            distance = np.linalg.norm(left_wrist - right_wrist)
            inter_hand_distances.append(distance)
        else:
            inter_hand_distances.append(0.0)
    
    # Calculate smart features
    features = calculate_smart_features(
        left_openness, right_openness, left_heights, right_heights,
        left_speeds, right_speeds, inter_hand_distances, landmarks_df
    )
    
    # Add new table and hidden hand features
    print("🔄 Calculating additional table and hidden hand features...")
    
    # Both hands hidden rate
    features['both_hands_hidden_rate'] = calculate_both_hands_hidden_rate(landmarks_df)
    
    # Table features
    table_features = calculate_table_features(landmarks_df)
    features.update(table_features)
    
    # Mixed hand positions
    features['mixed_hand_positions_rate'] = calculate_mixed_hand_features(landmarks_df)
    
    print(f"✅ Extracted {len(features)} smart features")
    return features

def extract_frame_landmarks(frame_data):
    """Extract left and right hand landmarks from frame data"""
    left_landmarks = []
    right_landmarks = []
    
    for joint in ['WRIST', 'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
                  'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
                  'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
                  'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
                  'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP']:
        
        left_coords = [frame_data.get(f'Left_{joint}_X', 0), 
                      frame_data.get(f'Left_{joint}_Y', 0), 
                      frame_data.get(f'Left_{joint}_Z', 0)]
        right_coords = [frame_data.get(f'Right_{joint}_X', 0), 
                       frame_data.get(f'Right_{joint}_Y', 0), 
                       frame_data.get(f'Right_{joint}_Z', 0)]
        
        left_landmarks.append(left_coords)
        right_landmarks.append(right_coords)
    
    return np.array(left_landmarks), np.array(right_landmarks)

def calculate_hand_openness(landmarks):
    """Calculate hand openness using palm center to finger tips distance"""
    # Create palm center from 6 landmarks (wrist + 5 finger bases)
    palm_center = np.mean([landmarks[0], landmarks[1], landmarks[5], 
                          landmarks[9], landmarks[13], landmarks[17]], axis=0)
    
    # Get 5 finger tips
    finger_tips = [landmarks[4], landmarks[8], landmarks[12], 
                  landmarks[16], landmarks[20]]
    
    # Calculate distances from palm center to each finger tip
    distances = [np.linalg.norm(tip - palm_center) for tip in finger_tips]
    
    # Hand openness = average of all 5 distances
    return np.mean(distances)

def calculate_hand_speed(landmarks, prev_landmarks, frame_index):
    """Calculate hand speed between consecutive frames"""
    if frame_index > 0 and prev_landmarks is not None:
        prev_wrist = prev_landmarks[0]
        curr_wrist = landmarks[0]
        speed = np.linalg.norm(curr_wrist - prev_wrist)
        return speed
    else:
        return 0.0

def calculate_smart_features(left_openness, right_openness, left_heights, right_heights,
                           left_speeds, right_speeds, inter_hand_distances, landmarks_df):
    """Calculate the 18 smart features from frame-level data"""
    print("🔄 Calculating smart features...")
    
    features = {}
    
    # Hand openness features (6 features)
    features['left_openness_mean'] = np.mean(left_openness)
    features['left_openness_std'] = np.std(left_openness)
    features['left_openness_max'] = np.max(left_openness)
    
    features['right_openness_mean'] = np.mean(right_openness)
    features['right_openness_std'] = np.std(right_openness)
    features['right_openness_max'] = np.max(right_openness)
    
    # Hand height features (4 features)
    features['left_height_mean'] = np.mean(left_heights)
    features['left_height_range'] = np.max(left_heights) - np.min(left_heights)
    
    features['right_height_mean'] = np.mean(right_heights)
    features['right_height_range'] = np.max(right_heights) - np.min(right_heights)
    
    # Hand detection rate (1 feature)
    valid_frames = sum(1 for i in range(len(landmarks_df)) 
                      if not np.all(landmarks_df.iloc[i][['Left_WRIST_X', 'Left_WRIST_Y', 'Left_WRIST_Z']].values == 0) or
                      not np.all(landmarks_df.iloc[i][['Right_WRIST_X', 'Right_WRIST_Y', 'Right_WRIST_Z']].values == 0))
    
    features['hand_detection_rate'] = valid_frames / len(landmarks_df)
    
    # Hand speed features (2 features)
    features['left_speed_mean'] = np.mean(left_speeds)
    features['right_speed_mean'] = np.mean(right_speeds)
    
    # Inter-hand distance features (2 features)
    features['inter_hand_distance_mean'] = np.mean(inter_hand_distances)
    features['inter_hand_distance_std'] = np.std(inter_hand_distances)
    
    # Combined features (3 features)
    features['total_openness'] = features['left_openness_mean'] + features['right_openness_mean']
    features['avg_height'] = (features['left_height_mean'] + features['right_height_mean']) / 2
    features['height_difference'] = abs(features['left_height_mean'] - features['right_height_mean'])
    
    # Additional smart features for better table/gesture detection (4 features)
    # Hand stability - how much hands bounce up and down
    features['left_height_std'] = np.std(left_heights)
    features['right_height_std'] = np.std(right_heights)
    
    # Table proximity - how close hands are to assumed table level (Y=0.7)
    table_level = 0.7  # Assumed table level based on your data
    
    # Only calculate table proximity if hands are detected (height > 0)
    if features['left_height_mean'] > 0:
        features['table_proximity_left'] = 1.0 - abs(features['left_height_mean'] - table_level)
    else:
        features['table_proximity_left'] = 0.0  # No hand detected = no table proximity
    
    if features['right_height_mean'] > 0:
        features['table_proximity_right'] = 1.0 - abs(features['right_height_mean'] - table_level)
    else:
        features['table_proximity_right'] = 0.0  # No hand detected = no table proximity
    
    return features

def calculate_both_hands_hidden_rate(landmarks_df):
    """Calculate rate when BOTH hands are completely hidden"""
    both_hidden_count = 0
    total_frames = len(landmarks_df)
    
    for i in range(total_frames):
        frame_data = landmarks_df.iloc[i]
        
        # Check if BOTH hands are missing (all coordinates = 0)
        left_missing = np.all(frame_data[['Left_WRIST_X', 'Left_WRIST_Y', 'Left_WRIST_Z']].values == 0)
        right_missing = np.all(frame_data[['Right_WRIST_X', 'Right_WRIST_Y', 'Right_WRIST_Z']].values == 0)
        
        if left_missing and right_missing:
            both_hidden_count += 1
    
    return both_hidden_count / total_frames

def calculate_table_features(landmarks_df):
    """Calculate table-related features with proper classification"""
    features = {}
    
    # Table level assumption (Y = 0.7)
    table_level = 0.7
    table_tolerance = 0.75  # Hands at Y=0.75 and above are considered "on table"
    movement_threshold = 0.1  # Minimum movement to consider as gesture (10% of frame)
    
    # Count frames for each category
    hands_on_table_frames = 0
    gestures_on_table_frames = 0
    other_gestures_frames = 0
    
    # Track previous positions for movement detection
    prev_left_y = None
    prev_right_y = None
    
    for i in range(len(landmarks_df)):
        frame_data = landmarks_df.iloc[i]
        
        # Check left hand
        left_detected = not np.all(frame_data[['Left_WRIST_X', 'Left_WRIST_Y', 'Left_WRIST_Z']].values == 0)
        left_near_table = False
        left_moving = False
        left_y = None  # Initialize left_y
        if left_detected:
            left_y = frame_data['Left_WRIST_Y']
            left_near_table = left_y >= table_tolerance  # Y >= 0.75 means on table
            
            # Check for movement
            if prev_left_y is not None:
                left_movement = abs(left_y - prev_left_y)
                left_moving = left_movement > movement_threshold
        
        # Check right hand  
        right_detected = not np.all(frame_data[['Right_WRIST_X', 'Right_WRIST_Y', 'Right_WRIST_Z']].values == 0)
        right_near_table = False
        right_moving = False
        right_y = None  # Initialize right_y
        if right_detected:
            right_y = frame_data['Right_WRIST_Y']
            right_near_table = right_y >= table_tolerance  # Y >= 0.75 means on table
            
            # Check for movement
            if prev_right_y is not None:
                right_movement = abs(right_y - prev_right_y)
                right_moving = right_movement > movement_threshold
        
        # Classification logic:
        
        # 0. HIDDEN HANDS: Both hands not detected (should be handled separately)
        if not left_detected and not right_detected:
            # Skip this frame - it's already counted in both_hands_hidden_rate
            # Don't count it as "other gestures"
            pass
        
        # 1. Hands-on-table: BOTH hands near table AND BOTH stationary
        elif (left_near_table and right_near_table and 
              left_detected and right_detected and 
              not left_moving and not right_moving):
            hands_on_table_frames += 1
        
        # 2. Gestures-on-table: At least one hand near table (Y < 0.75 - lower in frame)
        elif (left_detected or right_detected) and not (left_near_table or right_near_table):
            gestures_on_table_frames += 1
        
        # 3. Other gestures: Hands at Y >= 0.75 (higher in frame)
        elif left_near_table or right_near_table:
            other_gestures_frames += 1
        
        # Update previous positions for next iteration
        prev_left_y = left_y if left_detected else None
        prev_right_y = right_y if right_detected else None
    
    # Calculate rates
    total_frames = len(landmarks_df)
    features['hands_on_table_rate'] = hands_on_table_frames / total_frames
    features['gestures_on_table_rate'] = gestures_on_table_frames / total_frames
    features['other_gestures_rate'] = other_gestures_frames / total_frames
    
    return features

def calculate_mixed_hand_features(landmarks_df):
    """Detect when one hand is on table, other is in air"""
    mixed_position_frames = 0
    
    for i in range(len(landmarks_df)):
        frame_data = landmarks_df.iloc[i]
        
        # Check hand positions
        left_detected = not np.all(frame_data[['Left_WRIST_X', 'Left_WRIST_Y', 'Left_WRIST_Z']].values == 0)
        right_detected = not np.all(frame_data[['Right_WRIST_X', 'Right_WRIST_Y', 'Right_WRIST_Z']].values == 0)
        
        if left_detected and right_detected:
            left_y = frame_data['Left_WRIST_Y']
            right_y = frame_data['Right_WRIST_Y']
            
            # One hand on table, other in air
            left_on_table = abs(left_y - 0.7) <= 0.1
            right_on_table = abs(right_y - 0.7) <= 0.1
            
            if (left_on_table and not right_on_table) or (right_on_table and not left_on_table):
                mixed_position_frames += 1
    
    return mixed_position_frames / len(landmarks_df)

def get_feature_names():
    """Get the names of all 27 extracted features"""
    return [
        'left_openness_mean',
        'left_openness_std', 
        'left_openness_max',
        'right_openness_mean',
        'right_openness_std',
        'right_openness_max',
        'left_height_mean',
        'left_height_range',
        'right_height_mean',
        'right_height_range',
        'hand_detection_rate',
        'left_speed_mean',
        'right_speed_mean',
        'inter_hand_distance_mean',
        'inter_hand_distance_std',
        'total_openness',
        'avg_height',
        'height_difference',
        'left_height_std',
        'right_height_std',
        'table_proximity_left',
        'table_proximity_right',
        'both_hands_hidden_rate',
        'hands_on_table_rate',
        'gestures_on_table_rate',
        'other_gestures_rate',
        'mixed_hand_positions_rate'
    ]

def print_feature_descriptions():
    """Print descriptions of all 27 features"""
    print("🎯 FEATURE ENGINEERING - 27 EXTRACTED FEATURES")
    print("="*60)
    
    features = {
        'left_openness_mean': 'Average left hand openness (palm to fingertips)',
        'left_openness_std': 'Standard deviation of left hand openness',
        'left_openness_max': 'Maximum left hand openness',
        'right_openness_mean': 'Average right hand openness (palm to fingertips)',
        'right_openness_std': 'Standard deviation of right hand openness',
        'right_openness_max': 'Maximum right hand openness',
        'left_height_mean': 'Average left hand height (Y-coordinate)',
        'left_height_range': 'Range of left hand height movement',
        'right_height_mean': 'Average right hand height (Y-coordinate)',
        'right_height_range': 'Range of right hand height movement',
        'hand_detection_rate': 'Percentage of frames where hands were detected',
        'left_speed_mean': 'Average left hand movement speed',
        'right_speed_mean': 'Average right hand movement speed',
        'inter_hand_distance_mean': 'Average distance between left and right wrists',
        'inter_hand_distance_std': 'Standard deviation of inter-hand distance',
        'total_openness': 'Combined openness of both hands',
        'avg_height': 'Average height of both hands',
        'height_difference': 'Absolute difference between left and right hand heights',
        'left_height_std': 'Standard deviation of left hand height (stability)',
        'right_height_std': 'Standard deviation of right hand height (stability)',
        'table_proximity_left': 'How close left hand is to table level',
        'table_proximity_right': 'How close right hand is to table level',
        'both_hands_hidden_rate': 'Percentage of frames where both hands are completely hidden',
        'hands_on_table_rate': 'Percentage of frames where both hands are on table',
        'gestures_on_table_rate': 'Percentage of frames with gestures near table level',
        'other_gestures_rate': 'Percentage of frames with hands not near table (in air)',
        'mixed_hand_positions_rate': 'Percentage of frames with one hand on table, other in air'
    }
    
    for i, (feature, description) in enumerate(features.items(), 1):
        print(f"{i:2d}. {feature:<25} - {description}")
    
    print(f"\n✅ Total: {len(features)} features extracted from MediaPipe landmarks")

if __name__ == "__main__":
    # Print feature descriptions when run directly
    print_feature_descriptions()

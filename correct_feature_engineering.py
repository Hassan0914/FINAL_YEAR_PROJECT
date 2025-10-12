import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import os

class CorrectSmartGestureFeatureExtractor:
    """
    CORRECT Smart Feature Engineering - The one that worked well before!
    This is the original feature engineering that gave us R > 0.84
    """
    
    def __init__(self):
        self.landmark_names = [
            'WRIST', 'THUMB_CMC', 'THUMB_MCP', 'THUMB_IP', 'THUMB_TIP',
            'INDEX_FINGER_MCP', 'INDEX_FINGER_PIP', 'INDEX_FINGER_DIP', 'INDEX_FINGER_TIP',
            'MIDDLE_FINGER_MCP', 'MIDDLE_FINGER_PIP', 'MIDDLE_FINGER_DIP', 'MIDDLE_FINGER_TIP',
            'RING_FINGER_MCP', 'RING_FINGER_PIP', 'RING_FINGER_DIP', 'RING_FINGER_TIP',
            'PINKY_MCP', 'PINKY_PIP', 'PINKY_DIP', 'PINKY_TIP'
        ]
        
        # Key landmark indices
        self.WRIST = 0
        self.THUMB_TIP = 4
        self.INDEX_TIP = 8
        self.MIDDLE_TIP = 12
        self.RING_TIP = 16
        self.PINKY_TIP = 20
    
    def extract_hand_features(self, landmarks_df):
        """
        Extract the ORIGINAL smart features that worked well
        """
        features = []
        
        for idx, row in landmarks_df.iterrows():
            frame_features = {
                'frame_number': row['frame_number'],
                'left_hand_detected': row.get('left_hand_detected', False),
                'right_hand_detected': row.get('right_hand_detected', False)
            }
            
            # Process each hand separately
            for hand in ['LEFT', 'RIGHT']:
                hand_features = self._extract_single_hand_features(row, hand)
                frame_features.update(hand_features)
            
            # Inter-hand features
            inter_hand_features = self._extract_inter_hand_features(row)
            frame_features.update(inter_hand_features)
            
            features.append(frame_features)
        
        return pd.DataFrame(features)
    
    def _extract_single_hand_features(self, row, hand):
        """
        Extract features for a single hand - THE ORIGINAL WORKING VERSION
        """
        features = {}
        prefix = hand.lower() + '_'
        
        # Check if hand is detected
        hand_detected = row.get(f'{hand.lower()}_hand_detected', False)
        
        if not hand_detected:
            # If hand not detected, set all features to 0
            features.update({
                f'{prefix}hand_size': 0,
                f'{prefix}hand_height': 0,
                f'{prefix}hand_center_x': 0,
                f'{prefix}hand_center_y': 0,
                f'{prefix}hand_center_z': 0,
                f'{prefix}avg_fingertip_distance': 0,
                f'{prefix}thumb_index_angle': 0,
                f'{prefix}hand_openness': 0,
                f'{prefix}palm_orientation': 0,
                f'{prefix}movement_magnitude': 0,
                f'{prefix}hand_activity': 0,
                f'{prefix}finger_spread': 0
            })
            return features
        
        # Extract landmark coordinates
        landmarks = self._get_landmark_coordinates(row, hand)
        if landmarks is None:
            return features
        
        # 1. HAND SIZE (Distance Features)
        hand_size = self._calculate_hand_size(landmarks)
        features[f'{prefix}hand_size'] = hand_size
        
        # 2. HAND HEIGHT (Y-coordinate)
        hand_center = self._calculate_hand_center(landmarks)
        features[f'{prefix}hand_height'] = hand_center[1]  # Y-coordinate
        features[f'{prefix}hand_center_x'] = hand_center[0]
        features[f'{prefix}hand_center_y'] = hand_center[1]
        features[f'{prefix}hand_center_z'] = hand_center[2]
        
        # 3. HAND OPENNESS (Distance Features)
        # Distance from wrist to fingertips
        wrist = landmarks[self.WRIST]
        fingertips = [
            landmarks[self.THUMB_TIP],
            landmarks[self.INDEX_TIP],
            landmarks[self.MIDDLE_TIP],
            landmarks[self.RING_TIP],
            landmarks[self.PINKY_TIP]
        ]
        
        distances = [np.linalg.norm(wrist - tip) for tip in fingertips]
        features[f'{prefix}avg_fingertip_distance'] = np.mean(distances)
        
        # 4. THUMB-INDEX ANGLE (Angle Features)
        thumb_index_angle = self._calculate_thumb_index_angle(landmarks)
        features[f'{prefix}thumb_index_angle'] = thumb_index_angle
        
        # 5. HAND OPENNESS (Overall openness)
        hand_openness = self._calculate_hand_openness(landmarks)
        features[f'{prefix}hand_openness'] = hand_openness
        
        # 6. PALM ORIENTATION (Position Features)
        palm_orientation = self._calculate_palm_orientation(landmarks)
        features[f'{prefix}palm_orientation'] = palm_orientation
        
        # 7. MOVEMENT MAGNITUDE (Movement Features)
        movement_magnitude = self._calculate_movement_magnitude(landmarks)
        features[f'{prefix}movement_magnitude'] = movement_magnitude
        
        # 8. HAND ACTIVITY (Additional feature)
        hand_activity = self._calculate_hand_activity(landmarks)
        features[f'{prefix}hand_activity'] = hand_activity
        
        # 9. FINGER SPREAD (Additional feature)
        finger_spread = self._calculate_finger_spread(landmarks)
        features[f'{prefix}finger_spread'] = finger_spread
        
        return features
    
    def _extract_inter_hand_features(self, row):
        """
        Extract features between both hands
        """
        features = {}
        
        # Check if both hands are detected
        left_detected = row.get('left_hand_detected', False)
        right_detected = row.get('right_hand_detected', False)
        
        features['both_hands_detected'] = left_detected and right_detected
        
        if not (left_detected and right_detected):
            features.update({
                'hands_distance': 0,
                'hands_height_difference': 0,
                'inter_hand_activity': 0,
                'hands_synchronization': 0
            })
            return features
        
        # Get landmark coordinates for both hands
        left_landmarks = self._get_landmark_coordinates(row, 'LEFT')
        right_landmarks = self._get_landmark_coordinates(row, 'RIGHT')
        
        if left_landmarks is None or right_landmarks is None:
            features.update({
                'hands_distance': 0,
                'hands_height_difference': 0,
                'inter_hand_activity': 0,
                'hands_synchronization': 0
            })
            return features
        
        # 1. DISTANCE BETWEEN HANDS
        left_wrist = left_landmarks[self.WRIST]
        right_wrist = right_landmarks[self.WRIST]
        hands_distance = np.linalg.norm(np.array(left_wrist) - np.array(right_wrist))
        features['hands_distance'] = hands_distance
        
        # 2. HEIGHT DIFFERENCE BETWEEN HANDS
        height_diff = abs(left_wrist[1] - right_wrist[1])
        features['hands_height_difference'] = height_diff
        
        # 3. INTER-HAND ACTIVITY
        left_activity = self._calculate_hand_activity(left_landmarks)
        right_activity = self._calculate_hand_activity(right_landmarks)
        inter_hand_activity = (left_activity + right_activity) / 2
        features['inter_hand_activity'] = inter_hand_activity
        
        # 4. HANDS SYNCHRONIZATION
        hands_synchronization = self._calculate_hands_synchronization(left_landmarks, right_landmarks)
        features['hands_synchronization'] = hands_synchronization
        
        return features
    
    def add_temporal_features(self, features_df):
        """
        Add temporal features for gesture classification
        """
        temporal_features = features_df.copy()
        
        # Add velocity and acceleration for movement-based features
        movement_columns = [col for col in features_df.columns if 'movement_magnitude' in col or 'hand_activity' in col]
        
        for col in movement_columns:
            # Calculate velocity
            velocity_col = col.replace('_magnitude', '_velocity').replace('_activity', '_velocity')
            temporal_features[velocity_col] = temporal_features[col].diff()
            
            # Calculate acceleration
            acceleration_col = col.replace('_magnitude', '_acceleration').replace('_activity', '_acceleration')
            temporal_features[acceleration_col] = temporal_features[velocity_col].diff()
        
        return temporal_features.fillna(0)
    
    # Helper methods for feature calculations
    def _get_landmark_coordinates(self, row, hand):
        """Extract landmark coordinates for a specific hand"""
        hand_prefix = hand.lower()
        landmarks = []
        
        for landmark in self.landmark_names:
            x = row.get(f'{hand_prefix}_{landmark}_x', 0)
            y = row.get(f'{hand_prefix}_{landmark}_y', 0)
            z = row.get(f'{hand_prefix}_{landmark}_z', 0)
            landmarks.append([x, y, z])
        
        return np.array(landmarks)
    
    def _calculate_hand_size(self, landmarks):
        """Calculate hand size based on landmark spread"""
        if landmarks is None:
            return 0
        
        # Use distance from wrist to fingertips
        wrist = landmarks[self.WRIST]
        fingertip_distances = []
        
        for tip_idx in [self.THUMB_TIP, self.INDEX_TIP, self.MIDDLE_TIP, self.RING_TIP, self.PINKY_TIP]:
            tip = landmarks[tip_idx]
            distance = np.linalg.norm(np.array(wrist) - np.array(tip))
            fingertip_distances.append(distance)
        
        return np.mean(fingertip_distances)
    
    def _calculate_hand_center(self, landmarks):
        """Calculate hand center position"""
        if landmarks is None:
            return [0, 0, 0]
        
        return np.mean(landmarks, axis=0)
    
    def _calculate_thumb_index_angle(self, landmarks):
        """Calculate angle between thumb and index finger"""
        if landmarks is None:
            return 0
        
        thumb_tip = landmarks[self.THUMB_TIP]
        index_tip = landmarks[self.INDEX_TIP]
        wrist = landmarks[self.WRIST]
        
        # Calculate angle between thumb and index finger
        thumb_vector = np.array(thumb_tip) - np.array(wrist)
        index_vector = np.array(index_tip) - np.array(wrist)
        
        if np.linalg.norm(thumb_vector) == 0 or np.linalg.norm(index_vector) == 0:
            return 0
        
        cos_angle = np.dot(thumb_vector, index_vector) / (np.linalg.norm(thumb_vector) * np.linalg.norm(index_vector))
        angle = np.arccos(np.clip(cos_angle, -1, 1))
        
        return angle
    
    def _calculate_hand_openness(self, landmarks):
        """Calculate how open the hand is"""
        if landmarks is None:
            return 0
        
        # Use distance from fingertips to palm center
        palm_center = self._calculate_hand_center(landmarks)
        fingertip_distances = []
        
        for tip_idx in [self.THUMB_TIP, self.INDEX_TIP, self.MIDDLE_TIP, self.RING_TIP, self.PINKY_TIP]:
            tip = landmarks[tip_idx]
            distance = np.linalg.norm(np.array(palm_center) - np.array(tip))
            fingertip_distances.append(distance)
        
        return np.mean(fingertip_distances)
    
    def _calculate_palm_orientation(self, landmarks):
        """Calculate palm orientation"""
        if landmarks is None:
            return 0
        
        # Use wrist and middle finger MCP to determine palm orientation
        wrist = landmarks[self.WRIST]
        middle_mcp = landmarks[9]  # MIDDLE_FINGER_MCP
        
        # Calculate angle between wrist and middle finger MCP
        vector = np.array(middle_mcp) - np.array(wrist)
        angle = np.arctan2(vector[1], vector[0])
        
        return angle
    
    def _calculate_movement_magnitude(self, landmarks):
        """Calculate movement magnitude (placeholder - would need previous frame)"""
        # This would require temporal data, for now return 0
        return 0
    
    def _calculate_hand_activity(self, landmarks):
        """Calculate overall hand activity level"""
        if landmarks is None:
            return 0
        
        # Combine multiple factors for hand activity
        hand_size = self._calculate_hand_size(landmarks)
        hand_openness = self._calculate_hand_openness(landmarks)
        
        # Normalize and combine
        activity = (hand_size + hand_openness) / 2
        return activity
    
    def _calculate_finger_spread(self, landmarks):
        """Calculate how spread out the fingers are"""
        if landmarks is None:
            return 0
        
        # Calculate distances between fingertips
        fingertips = [
            landmarks[self.THUMB_TIP],
            landmarks[self.INDEX_TIP],
            landmarks[self.MIDDLE_TIP],
            landmarks[self.RING_TIP],
            landmarks[self.PINKY_TIP]
        ]
        
        # Calculate average distance between adjacent fingertips
        distances = []
        for i in range(len(fingertips) - 1):
            dist = np.linalg.norm(np.array(fingertips[i]) - np.array(fingertips[i+1]))
            distances.append(dist)
        
        return np.mean(distances) if distances else 0
    
    def _calculate_hands_synchronization(self, left_landmarks, right_landmarks):
        """Calculate how synchronized the two hands are"""
        if left_landmarks is None or right_landmarks is None:
            return 0
        
        # Calculate similarity between hand orientations
        left_orientation = self._calculate_palm_orientation(left_landmarks)
        right_orientation = self._calculate_palm_orientation(right_landmarks)
        
        # Calculate orientation difference
        orientation_diff = abs(left_orientation - right_orientation)
        
        # Convert to synchronization score (lower difference = higher synchronization)
        synchronization = 1.0 / (1.0 + orientation_diff)
        
        return synchronization

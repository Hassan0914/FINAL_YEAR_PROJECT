"""
Gesture Recognition Inference Pipeline
- Loads pretrained BiLSTM model
- Accepts MediaPipe landmarks (pose + hands) as input
- Returns predicted gesture class and confidence
"""

import os
import numpy as np
from tensorflow import keras

# Model configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'gesture_model.h5')
SEQUENCE_LENGTH = 203  # 7 seconds @ 29 FPS
N_FEATURES = 258  # 33 pose landmarks × 4 + 21 left hand × 3 + 21 right hand × 3

# Class labels (matching training)
CLASS_NAMES = [
    'self_touch',
    'hands_on_table',
    'hidden_hands',
    'gestures_on_table',
    'other_gestures'
]

class GesturePredictor:
    """Gesture recognition predictor using pretrained BiLSTM model."""
    
    def __init__(self, model_path=None):
        """
        Initialize the gesture predictor.
        
        Args:
            model_path: Path to the model file. If None, uses default path.
        """
        if model_path is None:
            model_path = MODEL_PATH
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        print(f"Loading model from: {model_path}")
        self.model = keras.models.load_model(model_path)
        print("Model loaded successfully!")
        
        # Buffer to store frames for sequence prediction
        self.frame_buffer = []
        self.sequence_length = SEQUENCE_LENGTH
    
    def reset_buffer(self):
        """Reset the frame buffer (useful for new gesture sequences)."""
        self.frame_buffer = []
    
    def add_frame(self, landmarks):
        """
        Add a frame of landmarks to the buffer.
        
        Args:
            landmarks: numpy array of shape (258,) containing MediaPipe landmarks
                       Format: [pose (132), left_hand (63), right_hand (63)]
        
        Returns:
            bool: True if buffer is full and ready for prediction
        """
        if landmarks.shape[0] != N_FEATURES:
            raise ValueError(f"Expected {N_FEATURES} features, got {landmarks.shape[0]}")
        
        self.frame_buffer.append(landmarks)
        
        # Keep only the last SEQUENCE_LENGTH frames
        if len(self.frame_buffer) > self.sequence_length:
            self.frame_buffer = self.frame_buffer[-self.sequence_length:]
        
        return len(self.frame_buffer) >= self.sequence_length
    
    def predict(self, landmarks_sequence=None):
        """
        Predict gesture from a sequence of landmarks.
        
        Args:
            landmarks_sequence: numpy array of shape (n_frames, 258) or None
                               If None, uses the internal buffer
        
        Returns:
            dict: {
                'class': str,  # Predicted class name
                'confidence': float,  # Confidence score (0-1)
                'all_probabilities': dict  # All class probabilities
            }
        """
        if landmarks_sequence is None:
            if len(self.frame_buffer) < self.sequence_length:
                # Pad with zeros if buffer is not full
                sequence = np.zeros((self.sequence_length, N_FEATURES), dtype=np.float32)
                sequence[-len(self.frame_buffer):] = np.array(self.frame_buffer)
            else:
                sequence = np.array(self.frame_buffer[-self.sequence_length:])
        else:
            # Use provided sequence
            if landmarks_sequence.shape[0] < self.sequence_length:
                # Pad if too short
                sequence = np.zeros((self.sequence_length, N_FEATURES), dtype=np.float32)
                sequence[-landmarks_sequence.shape[0]:] = landmarks_sequence
            elif landmarks_sequence.shape[0] > self.sequence_length:
                # Truncate if too long
                sequence = landmarks_sequence[-self.sequence_length:]
            else:
                sequence = landmarks_sequence
        
        # Reshape for model input: (1, sequence_length, n_features)
        sequence = sequence.reshape(1, self.sequence_length, N_FEATURES)
        
        # Predict
        predictions = self.model.predict(sequence, verbose=0)[0]
        
        # Get predicted class
        predicted_class_idx = np.argmax(predictions)
        predicted_class = CLASS_NAMES[predicted_class_idx]
        confidence = float(predictions[predicted_class_idx])
        
        # Create probability dictionary
        all_probabilities = {
            CLASS_NAMES[i]: float(predictions[i]) 
            for i in range(len(CLASS_NAMES))
        }
        
        return {
            'class': predicted_class,
            'confidence': confidence,
            'all_probabilities': all_probabilities
        }
    
    def predict_from_csv(self, csv_path):
        """
        Predict gesture from a CSV file containing landmarks.
        
        Args:
            csv_path: Path to CSV file with landmarks
        
        Returns:
            dict: Prediction result (same format as predict())
        """
        import pandas as pd
        
        df = pd.read_csv(csv_path)
        
        # Remove frame_number column if present
        if 'frame_number' in df.columns:
            df = df.drop(columns=['frame_number'])
        
        # Convert to numpy array
        landmarks_sequence = df.values.astype(np.float32)
        
        return self.predict(landmarks_sequence)


def convert_mediapipe_to_array(pose_landmarks, left_hand_landmarks, right_hand_landmarks):
    """
    Convert MediaPipe landmarks to the format expected by the model.
    
    Args:
        pose_landmarks: MediaPipe pose landmarks (33 landmarks)
        left_hand_landmarks: MediaPipe left hand landmarks (21 landmarks) or None
        right_hand_landmarks: MediaPipe right hand landmarks (21 landmarks) or None
    
    Returns:
        numpy array of shape (258,) with landmarks in the expected format
    """
    features = np.zeros(N_FEATURES, dtype=np.float32)
    
    # Pose landmarks: 33 × 4 (x, y, z, visibility)
    pose_start = 0
    for i, landmark in enumerate(pose_landmarks.landmark):
        idx = pose_start + i * 4
        features[idx] = landmark.x
        features[idx + 1] = landmark.y
        features[idx + 2] = landmark.z
        features[idx + 3] = landmark.visibility
    
    # Left hand landmarks: 21 × 3 (x, y, z)
    lh_start = 132
    if left_hand_landmarks:
        for i, landmark in enumerate(left_hand_landmarks.landmark):
            idx = lh_start + i * 3
            features[idx] = landmark.x
            features[idx + 1] = landmark.y
            features[idx + 2] = landmark.z
    
        # Right hand landmarks: 21 × 3 (x, y, z)
    rh_start = 195
    if right_hand_landmarks:
        for i, landmark in enumerate(right_hand_landmarks.landmark):
            idx = rh_start + i * 3
            features[idx] = landmark.x
            features[idx + 1] = landmark.y
            features[idx + 2] = landmark.z
    
    return features


# Example usage
if __name__ == "__main__":
    # Example 1: Predict from CSV file
    print("="*70)
    print("Example 1: Predict from CSV file")
    print("="*70)
    
    predictor = GesturePredictor()
    
    # Example CSV path (replace with actual path)
    example_csv = "../segmented_pose_hands_landmarks/P1/self_touch/segment_1.csv"
    if os.path.exists(example_csv):
        result = predictor.predict_from_csv(example_csv)
        print(f"\nPredicted Gesture: {result['class']}")
        print(f"Confidence: {result['confidence']:.4f}")
        print("\nAll Probabilities:")
        for class_name, prob in result['all_probabilities'].items():
            print(f"  {class_name}: {prob:.4f}")
    else:
        print(f"Example CSV not found: {example_csv}")
        print("Please provide a valid CSV path with landmarks.")
    
    # Example 2: Real-time prediction (frame by frame)
    print("\n" + "="*70)
    print("Example 2: Real-time prediction (frame by frame)")
    print("="*70)
    
    predictor.reset_buffer()
    
    # Simulate adding frames (replace with actual MediaPipe landmarks)
    print("\nSimulating frame-by-frame prediction...")
    print("(In real usage, add frames from MediaPipe as they arrive)")
    
    # Create dummy landmarks for demonstration
    for i in range(10):
        dummy_landmarks = np.random.rand(N_FEATURES).astype(np.float32)
        is_ready = predictor.add_frame(dummy_landmarks)
        
        if is_ready:
            result = predictor.predict()
            print(f"\nFrame {i+1}: Buffer ready! Prediction: {result['class']} ({result['confidence']:.4f})")
        else:
            print(f"Frame {i+1}: Buffer filling... ({len(predictor.frame_buffer)}/{SEQUENCE_LENGTH} frames)")


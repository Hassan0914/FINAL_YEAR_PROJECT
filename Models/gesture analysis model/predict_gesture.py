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
# Try to find the correct model file
# Priority: 1) bilstm_epoch_15.keras, 2) config.json + model.weights.h5 (from ZIP), 3) gesture_model.h5
_MODEL_DIR = os.path.dirname(__file__)
_PARENT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(_MODEL_DIR)))  # Go up to C:\FRONTEND

# Check for .keras file first (ONLY the correct model, no fallbacks)
_MODEL_CANDIDATES = [
    os.path.join(_MODEL_DIR, 'bilstm_epoch_15.keras'),
    os.path.join(_PARENT_DIR, 'bilstm_epoch_15.keras'),  # Check C:\FRONTEND
]

MODEL_PATH = None
MODEL_CONFIG_PATH = None
MODEL_WEIGHTS_PATH = None

for candidate in _MODEL_CANDIDATES:
    if os.path.exists(candidate):
        MODEL_PATH = candidate
        print(f"Found model at: {MODEL_PATH}")
        break

# If no .keras file, check for config.json + model.weights.h5 (from bilstm_epoch_15.keras.zip)
if MODEL_PATH is None:
    config_path = os.path.join(_MODEL_DIR, 'config.json')
    weights_path = os.path.join(_MODEL_DIR, 'model.weights.h5')
    if os.path.exists(config_path) and os.path.exists(weights_path):
        MODEL_CONFIG_PATH = config_path
        MODEL_WEIGHTS_PATH = weights_path
        print(f"Found model config: {MODEL_CONFIG_PATH}")
        print(f"Found model weights: {MODEL_WEIGHTS_PATH}")
    # NO FALLBACK - if neither found, will raise error in __init__

SEQUENCE_LENGTH = 30  # 1 second @ 30 FPS (MATCHING TRAINING)
N_FEATURES = 174  # 48 pose features (12 landmarks × 4) + 126 hand features (21 × 3 × 2)

# Class labels (matching training - 4 classes, no other_gestures in output)
CLASS_NAMES = [
    'self_touch',
    'hands_on_table',
    'hidden_hands',
    'gestures_on_table'
]

class GesturePredictor:
    """Gesture recognition predictor using pretrained BiLSTM model."""
    
    def __init__(self, model_path=None):
        """
        Initialize the gesture predictor.
        
        Args:
            model_path: Path to the model file. If None, uses automatic detection.
        """
        if model_path is None:
            # Use automatic detection
            if MODEL_PATH and os.path.exists(MODEL_PATH):
                model_path = MODEL_PATH
            elif MODEL_CONFIG_PATH and MODEL_WEIGHTS_PATH:
                # Load from config + weights (from bilstm_epoch_15.keras.zip)
                import json
                print(f"Loading model from config + weights...")
                with open(MODEL_CONFIG_PATH, 'r') as f:
                    config_data = json.load(f)
                
                # The config.json structure: {"module": "keras", "class_name": "Sequential", "config": {...}, "compile_config": {...}}
                # Extract the Sequential model config from "config" key
                model_config = config_data.get('config', {})
                
                # Reconstruct Sequential model from config
                # The model_config contains {"name": "sequential", "layers": [...]}
                from tensorflow.keras.models import Sequential
                self.model = Sequential.from_config(model_config)
                
                # Load weights
                print(f"Loading weights from: {MODEL_WEIGHTS_PATH}")
                self.model.load_weights(MODEL_WEIGHTS_PATH)
                
                # Compile the model (needed for prediction)
                from tensorflow.keras.optimizers import Adam
                compile_config = config_data.get('compile_config', {})
                if compile_config:
                    optimizer_config = compile_config.get('optimizer', {})
                    if isinstance(optimizer_config, dict) and 'config' in optimizer_config:
                        opt_config = optimizer_config['config']
                        learning_rate = opt_config.get('learning_rate', 0.0005)
                    else:
                        learning_rate = 0.0005
                    
                    self.model.compile(
                        optimizer=Adam(learning_rate=learning_rate),
                        loss=compile_config.get('loss', 'sparse_categorical_crossentropy'),
                        metrics=compile_config.get('metrics', ['accuracy'])
                    )
                else:
                    # Default compilation if compile_config not found
                    self.model.compile(
                        optimizer=Adam(learning_rate=0.0005),
                        loss='sparse_categorical_crossentropy',
                        metrics=['accuracy']
                    )
                
                # Validate model shape
                model_input_shape = self.model.input_shape
                expected_shape = (None, SEQUENCE_LENGTH, N_FEATURES)
                print(f"Model input shape: {model_input_shape}")
                print(f"Expected shape: {expected_shape}")
                
                if model_input_shape[1:] != (SEQUENCE_LENGTH, N_FEATURES):
                    raise ValueError(
                        f"Model shape mismatch!\n"
                        f"  Model expects: {model_input_shape[1:]}\n"
                        f"  Code expects: ({SEQUENCE_LENGTH}, {N_FEATURES})"
                    )
                
                print("Model loaded successfully from config + weights!")
                self.sequence_length = SEQUENCE_LENGTH
                return
            else:
                # NO FALLBACK - raise error if model files not found
                raise FileNotFoundError(
                    f"Model loading failed: Required model files not found!\n"
                    f"Please ensure bilstm_epoch_15.keras.zip is extracted to: {os.path.dirname(__file__)}\n"
                    f"Expected files:\n"
                    f"  - bilstm_epoch_15.keras (in model directory or C:\\FRONTEND)\n"
                    f"  OR\n"
                    f"  - config.json + model.weights.h5 (extracted from bilstm_epoch_15.keras.zip)"
                )
        
        # If MODEL_PATH was set, load from that path
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model file not found: {model_path}\n"
                f"Please ensure bilstm_epoch_15.keras.zip is extracted to: {os.path.dirname(__file__)}\n"
                f"Expected files: config.json + model.weights.h5 OR bilstm_epoch_15.keras"
            )
        self.model = keras.models.load_model(model_path)
        
        # Check model input shape
        model_input_shape = self.model.input_shape
        expected_shape = (None, SEQUENCE_LENGTH, N_FEATURES)
        
        print(f"Model input shape: {model_input_shape}")
        print(f"Expected shape: {expected_shape}")
        
        if model_input_shape[1:] != (SEQUENCE_LENGTH, N_FEATURES):
            raise ValueError(
                f"Model shape mismatch!\n"
                f"  Model expects: {model_input_shape[1:]}\n"
                f"  Code expects: ({SEQUENCE_LENGTH}, {N_FEATURES})\n"
                f"\n"
                f"SOLUTION: You need to retrain the model with the new configuration:\n"
                f"  - Sequence length: {SEQUENCE_LENGTH} frames (1 second @ 30 FPS)\n"
                f"  - Features: {N_FEATURES} (48 pose + 126 hand)\n"
                f"\n"
                f"Run your training script to generate a new model file."
            )
        
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
        
        # DEBUG: Log raw model output
        if hasattr(self, '_debug_count'):
            self._debug_count += 1
        else:
            self._debug_count = 1
        
        if self._debug_count <= 3:  # Log first 3 predictions for debugging
            print(f"[DEBUG] Raw model output (first prediction): {predictions}")
            print(f"[DEBUG] Class mapping: {CLASS_NAMES}")
            print(f"[DEBUG] Argmax index: {np.argmax(predictions)}")
        
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
    MATCHES TRAINING FORMAT EXACTLY:
    - 48 Pose features: 12 landmarks (indices 11-22) × (x, y, z, visibility)
      Order: LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW,
             LEFT_WRIST, RIGHT_WRIST, LEFT_PINKY, RIGHT_PINKY,
             LEFT_INDEX, RIGHT_INDEX, LEFT_THUMB, RIGHT_THUMB
    - 126 Hand features: 21 left hand × 3 + 21 right hand × 3
    Total: 174 features
    
    Args:
        pose_landmarks: MediaPipe pose landmarks (33 landmarks total, but we only use 11-22)
        left_hand_landmarks: MediaPipe left hand landmarks (21 landmarks) or None
        right_hand_landmarks: MediaPipe right hand landmarks (21 landmarks) or None
    
    Returns:
        numpy array of shape (174,) with landmarks in the expected format
    """
    features = np.zeros(N_FEATURES, dtype=np.float32)
    
    # Pose landmarks: ONLY 12 landmarks (indices 11-22) × 4 (x, y, z, visibility) = 48 features
    # MediaPipe indices: 11=LEFT_SHOULDER, 12=RIGHT_SHOULDER, 13=LEFT_ELBOW, 14=RIGHT_ELBOW,
    #                    15=LEFT_WRIST, 16=RIGHT_WRIST, 17=LEFT_PINKY, 18=RIGHT_PINKY,
    #                    19=LEFT_INDEX, 20=RIGHT_INDEX, 21=LEFT_THUMB, 22=RIGHT_THUMB
    # This matches the CSV order after filtering out facial landmarks (nose, eyes, ears, mouth)
    if pose_landmarks:
        pose_landmark_indices = list(range(11, 23))  # 12 landmarks: indices 11-22
        for idx_in_pose, landmark_idx in enumerate(pose_landmark_indices):
            landmark = pose_landmarks.landmark[landmark_idx]
            feature_idx = idx_in_pose * 4  # Each landmark has 4 features (x, y, z, visibility)
            features[feature_idx] = landmark.x
            features[feature_idx + 1] = landmark.y
            features[feature_idx + 2] = landmark.z
            features[feature_idx + 3] = landmark.visibility
    
    # Left hand landmarks: 21 × 3 (x, y, z) = 63 features, starting at index 48
    if left_hand_landmarks:
        for i, landmark in enumerate(left_hand_landmarks.landmark):
            feature_idx = 48 + i * 3  # Start at 48 (after 12 pose landmarks × 4)
            features[feature_idx] = landmark.x
            features[feature_idx + 1] = landmark.y
            features[feature_idx + 2] = landmark.z
    
    # Right hand landmarks: 21 × 3 (x, y, z) = 63 features, starting at index 111
    if right_hand_landmarks:
        for i, landmark in enumerate(right_hand_landmarks.landmark):
            feature_idx = 111 + i * 3  # Start at 111 (after 48 pose + 63 left hand)
            features[feature_idx] = landmark.x
            features[feature_idx + 1] = landmark.y
            features[feature_idx + 2] = landmark.z
    
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


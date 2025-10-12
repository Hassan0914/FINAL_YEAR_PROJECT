import pandas as pd
import numpy as np
import joblib
import os
from correct_feature_engineering import CorrectSmartGestureFeatureExtractor

class NewVideoGesturePredictor:
    """
    Predict gesture scores for new videos using trained models
    """
    
    def __init__(self, models_folder="final_trained_models"):
        """
        Initialize the predictor with trained models
        
        Args:
            models_folder (str): Path to folder containing trained models
        """
        self.feature_extractor = CorrectSmartGestureFeatureExtractor()
        self.models = {}
        self.models_folder = models_folder
        
        # Gesture classes
        self.gesture_classes = [
            'hidden_hands_score',
            'hands_on_table_score', 
            'gestures_on_table_score',
            'other_gestures_score',
            'self_touch_score'
        ]
        
        # Load all trained models
        self.load_models()
    
    def load_models(self):
        """
        Load all trained models from the models folder
        """
        print("Loading trained models...")
        
        for gesture_class in self.gesture_classes:
            model_path = os.path.join(self.models_folder, f"{gesture_class}_model.joblib")
            
            if os.path.exists(model_path):
                try:
                    self.models[gesture_class] = joblib.load(model_path)
                    print(f"Loaded model for {gesture_class}")
                except Exception as e:
                    print(f"Error loading {gesture_class}: {e}")
            else:
                print(f"Model file not found: {model_path}")
        
        print(f"Loaded {len(self.models)} models successfully")
    
    def extract_features_from_landmarks(self, landmarks_df):
        """
        Extract features from landmark data
        
        Args:
            landmarks_df (pd.DataFrame): DataFrame containing MediaPipe landmarks
            
        Returns:
            pd.DataFrame: Extracted features
        """
        print("Extracting features from landmarks...")
        
        # Extract hand features
        features_df = self.feature_extractor.extract_hand_features(landmarks_df)
        
        # Add temporal features
        temporal_df = self.feature_extractor.add_temporal_features(features_df)
        
        print(f"Extracted {len(temporal_df.columns)-1} features from {len(temporal_df)} frames")
        
        return temporal_df
    
    def predict_gesture_scores(self, features_df):
        """
        Predict gesture scores for a video
        
        Args:
            features_df (pd.DataFrame): Extracted features
            
        Returns:
            dict: Predicted scores for each gesture class
        """
        if not self.models:
            print("No models loaded!")
            return None
        
        print("Making gesture predictions...")
        
        # Get average features for the video
        avg_features = features_df.select_dtypes(include=[np.number]).mean()
        
        # Get feature columns (exclude non-feature columns)
        feature_columns = [col for col in avg_features.index 
                          if col not in ['frame_number']]
        
        # Prepare features for prediction and pad to 30 features
        feature_values = avg_features[feature_columns].fillna(0).values
        
        # Pad or truncate to exactly 30 features
        if len(feature_values) < 30:
            # Pad with zeros to reach 30 features
            padded_features = np.pad(feature_values, (0, 30 - len(feature_values)), 'constant')
        elif len(feature_values) > 30:
            # Truncate to 30 features
            padded_features = feature_values[:30]
        else:
            padded_features = feature_values
        
        X = padded_features.reshape(1, -1)
        
        # Make predictions for each gesture class
        predictions = {}
        
        for gesture_class, model in self.models.items():
            try:
                pred = model.predict(X)[0]
                # Ensure score is between 1 and 7
                score = max(1, min(7, int(pred)))
                predictions[gesture_class] = score
                print(f"  {gesture_class}: {score}")
            except Exception as e:
                print(f"Error predicting {gesture_class}: {e}")
                predictions[gesture_class] = 1  # Default score
        
        return predictions
    
    def predict_from_landmarks_file(self, landmarks_file_path):
        """
        Predict gesture scores from a landmarks CSV file
        
        Args:
            landmarks_file_path (str): Path to landmarks CSV file
            
        Returns:
            dict: Predicted scores for each gesture class
        """
        print(f" Processing landmarks file: {landmarks_file_path}")
        
        try:
            # Load landmarks data
            landmarks_df = pd.read_csv(landmarks_file_path)
            print(f" Loaded {len(landmarks_df)} frames")
            
            # Extract features
            features_df = self.extract_features_from_landmarks(landmarks_df)
            
            # Make predictions
            predictions = self.predict_gesture_scores(features_df)
            
            return predictions
            
        except Exception as e:
            print(f" Error processing file: {e}")
            return None
    
    def predict_from_landmarks_data(self, landmarks_data):
        """
        Predict gesture scores from landmarks data (DataFrame or dict)
        
        Args:
            landmarks_data: DataFrame or dict containing landmark data
            
        Returns:
            dict: Predicted scores for each gesture class
        """
        print(" Processing landmarks data...")
        
        try:
            # Convert to DataFrame if needed
            if isinstance(landmarks_data, dict):
                landmarks_df = pd.DataFrame(landmarks_data)
            else:
                landmarks_df = landmarks_data
            
            print(f" Processing {len(landmarks_df)} frames")
            
            # Extract features
            features_df = self.extract_features_from_landmarks(landmarks_df)
            
            # Make predictions
            predictions = self.predict_gesture_scores(features_df)
            
            return predictions
            
        except Exception as e:
            print(f" Error processing data: {e}")
            return None
    
    def get_gesture_classification(self, predictions):
        """
        Get the primary gesture class based on predictions
        
        Args:
            predictions (dict): Predicted scores
            
        Returns:
            dict: Gesture classification results
        """
        if not predictions:
            return None
        
        # Find the gesture class with highest score
        primary_gesture = max(predictions.items(), key=lambda x: x[1])
        
        # Create classification results
        results = {
            'primary_gesture': primary_gesture[0].replace('_score', ''),
            'primary_score': primary_gesture[1],
            'all_scores': predictions,
            'gesture_description': self.get_gesture_description(primary_gesture[0])
        }
        
        return results
    
    def get_gesture_description(self, gesture_class):
        """
        Get human-readable description of gesture class
        
        Args:
            gesture_class (str): Gesture class name
            
        Returns:
            str: Human-readable description
        """
        descriptions = {
            'hidden_hands_score': 'No hands visible in the image',
            'hands_on_table_score': 'Hands resting on table',
            'gestures_on_table_score': 'Gesturing while hands close to table',
            'other_gestures_score': 'Gesturing while hands not close to table',
            'self_touch_score': 'Touching face, hair, or torso'
        }
        
        return descriptions.get(gesture_class, 'Unknown gesture')
    
    def print_results(self, predictions, classification=None):
        """
        Print prediction results in a formatted way
        
        Args:
            predictions (dict): Predicted scores
            classification (dict): Gesture classification results
        """
        print("\n GESTURE PREDICTION RESULTS")
        print("=" * 50)
        
        if predictions:
            for gesture_class, score in predictions.items():
                gesture_name = gesture_class.replace('_score', '').replace('_', ' ').title()
                print(f" {gesture_name}: {score}/7")
        
        if classification:
            print(f"\n PRIMARY GESTURE: {classification['primary_gesture'].replace('_', ' ').title()}")
            print(f" SCORE: {classification['primary_score']}/7")
            print(f" DESCRIPTION: {classification['gesture_description']}")
        
        print("=" * 50)


def main():
    """
    Example usage of the NewVideoGesturePredictor
    """
    print(" NEW VIDEO GESTURE PREDICTOR")
    print("=" * 40)
    
    # Initialize predictor
    predictor = NewVideoGesturePredictor()
    
    # Example 1: Predict from landmarks file
    landmarks_file = "landmarks_improved/P1.csv"  # Replace with your landmarks file
    
    if os.path.exists(landmarks_file):
        print(f"\n Example 1: Predicting from file {landmarks_file}")
        predictions = predictor.predict_from_landmarks_file(landmarks_file)
        
        if predictions:
            classification = predictor.get_gesture_classification(predictions)
            predictor.print_results(predictions, classification)
    else:
        print(f" Landmarks file not found: {landmarks_file}")
    
    # Example 2: Predict from landmarks data
    print(f"\n Example 2: Predicting from landmarks data")
    
    # Create sample landmarks data (replace with your actual data)
    sample_landmarks = {
        'frame_number': [1, 2, 3],
        'left_hand_detected': [True, True, True],
        'right_hand_detected': [False, False, False],
        'left_WRIST_x': [0.5, 0.5, 0.5],
        'left_WRIST_y': [0.3, 0.3, 0.3],
        'left_WRIST_z': [0.1, 0.1, 0.1],
        # Add more landmark columns as needed
    }
    
    predictions = predictor.predict_from_landmarks_data(sample_landmarks)
    
    if predictions:
        classification = predictor.get_gesture_classification(predictions)
        predictor.print_results(predictions, classification)


if __name__ == "__main__":
    main()

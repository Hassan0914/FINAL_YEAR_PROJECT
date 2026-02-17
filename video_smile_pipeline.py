"""
Video Smile Score Prediction Pipeline
For processing UPLOADED recorded videos

Flow:
1. User uploads recorded video (mp4, avi, webm)
2. SHORE extracts facial features from each frame
3. Statistics calculated from all frames
4. ML model predicts smile score (1-7 scale)
"""

import os
import numpy as np
import pandas as pd
import joblib
import cv2

# ============================================================
# LOAD TRAINED MODEL
# ============================================================

MODEL_PATH = os.path.join(os.path.dirname(__file__), "smile_model.joblib")
artifacts = joblib.load(MODEL_PATH)
model = artifacts['model']
scaler = artifacts['scaler']
feature_cols = artifacts['feature_cols']

print(f"Model loaded. R² Score: {artifacts['r2_score']:.4f}")


# ============================================================
# SHORE FEATURE EXTRACTION
# ============================================================

class SHOREFeatureExtractor:
    """
    Extracts 5 facial features per frame using SHORE technology
    
    Features:
        attr1: Smile/Happiness intensity (0-100)
        attr2: Face detection confidence (0-100)
        attr3: Mouth openness score (0-100)
        attr4: Eye openness metrics (0-100)
        attr5: Additional expression score (0-100)
    """
    
    def __init__(self):
        # Initialize OpenCV cascades (fallback when SHORE unavailable)
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self.smile_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_smile.xml'
        )
    
    def extract_from_frame(self, frame):
        """
        Extract 5 SHORE features from a single video frame
        
        Args:
            frame: BGR image (numpy array from cv2.VideoCapture)
        
        Returns:
            numpy array of 5 features
        """
        features = np.zeros(5)
        
        # TODO: Replace with actual SHORE SDK call
        # Example SHORE integration:
        # result = shore_engine.process(frame)
        # if result.faces:
        #     face = result.faces[0]
        #     features[0] = face.happiness
        #     features[1] = face.confidence
        #     features[2] = face.mouth_open
        #     features[3] = face.eye_openness
        #     features[4] = face.expression
        
        # Fallback: OpenCV-based extraction
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) > 0:
                x, y, w, h = faces[0]
                face_roi = gray[y:y+h, x:x+w]
                
                # Smile detection
                smiles = self.smile_cascade.detectMultiScale(face_roi, 1.8, 20)
                features[0] = min(100, len(smiles) * 25)
                
                # Face confidence (size-based)
                features[1] = min(100, (w * h) / (frame.shape[0] * frame.shape[1]) * 500)
                
                # Mouth region metric
                features[2] = w / h * 50
                
                # Eye region brightness
                features[3] = np.mean(face_roi[int(h*0.2):int(h*0.5), :]) / 2.55
                
                # Expression variance
                features[4] = np.std(face_roi) / 2.55
                
        except Exception:
            pass
        
        return features


# ============================================================
# STATISTICAL FEATURE CALCULATION
# ============================================================

def calculate_statistics(data):
    """
    Calculate 160 statistical features from frame-level data
    Same as training pipeline
    """
    if data.ndim == 1:
        data = data.reshape(-1, 1)
    
    stats = {}
    num_cols = data.shape[1]
    
    for col in range(num_cols):
        col_data = data[:, col]
        prefix = f"attr{col+1}"
        
        # Basic statistics
        stats[f"{prefix}_std"] = np.std(col_data)
        stats[f"{prefix}_mean"] = np.mean(col_data)
        stats[f"{prefix}_min"] = np.min(col_data)
        stats[f"{prefix}_max"] = np.max(col_data)
        stats[f"{prefix}_range"] = np.max(col_data) - np.min(col_data)
        stats[f"{prefix}_median"] = np.median(col_data)
        stats[f"{prefix}_var"] = np.var(col_data)
        stats[f"{prefix}_q25"] = np.percentile(col_data, 25)
        stats[f"{prefix}_q75"] = np.percentile(col_data, 75)
        stats[f"{prefix}_iqr"] = stats[f"{prefix}_q75"] - stats[f"{prefix}_q25"]
        stats[f"{prefix}_skew"] = pd.Series(col_data).skew()
        stats[f"{prefix}_kurt"] = pd.Series(col_data).kurtosis()
        
        # Additional percentiles
        stats[f"{prefix}_q10"] = np.percentile(col_data, 10)
        stats[f"{prefix}_q90"] = np.percentile(col_data, 90)
        stats[f"{prefix}_q05"] = np.percentile(col_data, 5)
        stats[f"{prefix}_q95"] = np.percentile(col_data, 95)
        
        # Time-series features
        stats[f"{prefix}_rms"] = np.sqrt(np.mean(col_data**2))
        stats[f"{prefix}_energy"] = np.sum(col_data**2)
        stats[f"{prefix}_entropy"] = -np.sum(
            np.abs(col_data/np.sum(np.abs(col_data)+1e-10)) * 
            np.log(np.abs(col_data/np.sum(np.abs(col_data)+1e-10))+1e-10)
        )
        
        # Rate of change
        diff = np.diff(col_data)
        stats[f"{prefix}_diff_mean"] = np.mean(diff) if len(diff) > 0 else 0
        stats[f"{prefix}_diff_std"] = np.std(diff) if len(diff) > 0 else 0
        stats[f"{prefix}_diff_max"] = np.max(np.abs(diff)) if len(diff) > 0 else 0
        
        # Signal features
        stats[f"{prefix}_zero_cross"] = np.sum(np.diff(np.signbit(col_data - np.mean(col_data))))
        
        peaks = sum(1 for i in range(1, len(col_data)-1) 
                   if col_data[i] > col_data[i-1] and col_data[i] > col_data[i+1])
        stats[f"{prefix}_peaks"] = peaks
        
        if len(col_data) > 1:
            autocorr = np.corrcoef(col_data[:-1], col_data[1:])[0, 1]
            stats[f"{prefix}_autocorr"] = autocorr if not np.isnan(autocorr) else 0
        else:
            stats[f"{prefix}_autocorr"] = 0
        
        stats[f"{prefix}_cv"] = stats[f"{prefix}_std"] / (stats[f"{prefix}_mean"] + 1e-10)
        stats[f"{prefix}_mad"] = np.mean(np.abs(col_data - np.mean(col_data)))
        stats[f"{prefix}_sma"] = np.sum(np.abs(col_data)) / len(col_data)
    
    # Cross-correlations
    for i in range(num_cols):
        for j in range(i+1, num_cols):
            corr = np.corrcoef(data[:, i], data[:, j])[0, 1]
            stats[f"corr_{i+1}_{j+1}"] = corr if not np.isnan(corr) else 0
            stats[f"ratio_mean_{i+1}_{j+1}"] = np.mean(data[:, i]) / (np.mean(data[:, j]) + 1e-10)
    
    return stats


# ============================================================
# MAIN PIPELINE FUNCTION
# ============================================================

def process_uploaded_video(video_path, sample_rate=3):
    """
    Process an uploaded video file and predict smile score
    
    Args:
        video_path: Path to uploaded video file (mp4, avi, webm, mov)
        sample_rate: Process every Nth frame (default: 3)
    
    Returns:
        dict with:
            - smile_score: Predicted score (1-7 scale)
            - frames_processed: Number of frames analyzed
            - interpretation: Human-readable result
    """
    
    # Step 1: Open video file
    print(f"\n[1/4] Opening video: {video_path}")
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    
    print(f"    Video: {total_frames} frames, {fps:.1f} FPS, {duration:.1f} seconds")
    
    # Step 2: Extract SHORE features from each frame
    print(f"\n[2/4] Extracting SHORE features (every {sample_rate} frames)...")
    extractor = SHOREFeatureExtractor()
    
    frame_features = []
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % sample_rate == 0:
            features = extractor.extract_from_frame(frame)
            frame_features.append(features)
            
            if len(frame_features) % 100 == 0:
                print(f"    Processed {len(frame_features)} frames...")
        
        frame_count += 1
    
    cap.release()
    frame_features = np.array(frame_features)
    print(f"    Extracted features from {len(frame_features)} frames")
    
    if len(frame_features) < 10:
        raise ValueError("Video too short or no faces detected")
    
    # Step 3: Calculate statistical features
    print(f"\n[3/4] Calculating statistical features...")
    stats = calculate_statistics(frame_features)
    print(f"    Generated {len(stats)} statistical features")
    
    # Step 4: Predict smile score
    print(f"\n[4/4] Predicting smile score...")
    X = np.array([[stats.get(col, 0) for col in feature_cols]])
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    X_scaled = scaler.transform(X)
    smile_score = float(model.predict(X_scaled)[0])
    
    # Generate interpretation
    if smile_score >= 6.0:
        interpretation = "Very High - Excellent positive engagement"
    elif smile_score >= 5.0:
        interpretation = "High - Good positive expressions"
    elif smile_score >= 4.0:
        interpretation = "Moderate - Average engagement"
    elif smile_score >= 3.0:
        interpretation = "Low - Limited positive expressions"
    else:
        interpretation = "Very Low - Minimal smiling"
    
    result = {
        'smile_score': round(smile_score, 4),
        'frames_processed': len(frame_features),
        'video_duration_seconds': round(duration, 2),
        'interpretation': interpretation
    }
    
    print(f"\n{'='*50}")
    print(f"RESULT: Smile Score = {result['smile_score']:.2f} / 7")
    print(f"        {interpretation}")
    print(f"{'='*50}")
    
    return result


# ============================================================
# COMMAND LINE USAGE
# ============================================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("\nUsage: python video_smile_pipeline.py <video_path>")
        print("\nExample:")
        print("  python video_smile_pipeline.py interview.mp4")
        print("  python video_smile_pipeline.py C:\\Videos\\candidate_123.avi")
        sys.exit(0)
    
    video_path = sys.argv[1]
    
    if not os.path.exists(video_path):
        print(f"Error: File not found: {video_path}")
        sys.exit(1)
    
    result = process_uploaded_video(video_path)
    print(f"\nFinal Result: {result}")

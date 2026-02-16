"""
Script to understand the exact feature format used in training.
This will help us match the inference feature extraction to training.
"""

import pandas as pd
import numpy as np
import os

def filter_facial_landmarks(df: pd.DataFrame) -> pd.DataFrame:
    """Remove facial landmarks (nose, eyes, ears, mouth) - EXACT COPY FROM TRAINING."""
    facial_prefixes = [
        "POSE_NOSE", "POSE_LEFT_EYE_INNER", "POSE_LEFT_EYE", "POSE_LEFT_EYE_OUTER",
        "POSE_RIGHT_EYE_INNER", "POSE_RIGHT_EYE", "POSE_RIGHT_EYE_OUTER",
        "POSE_LEFT_EAR", "POSE_RIGHT_EAR", "POSE_MOUTH_LEFT", "POSE_MOUTH_RIGHT",
    ]
    columns = df.columns.tolist()
    filtered_columns = []
    for col in columns:
        keep = True
        for prefix in facial_prefixes:
            if col.startswith(prefix):
                keep = False
                break
        if keep:
            filtered_columns.append(col)
    return df[filtered_columns]

def analyze_csv_structure(csv_path: str):
    """Analyze a CSV file to understand the column structure."""
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return None
    
    df = pd.read_csv(csv_path)
    print(f"\n{'='*70}")
    print(f"CSV File: {csv_path}")
    print(f"{'='*70}")
    print(f"Shape: {df.shape}")
    print(f"\nAll columns ({len(df.columns)}):")
    for i, col in enumerate(df.columns):
        print(f"  {i:3d}: {col}")
    
    # Filter like training does
    df_filtered = filter_facial_landmarks(df)
    print(f"\nAfter filtering facial landmarks: {df_filtered.shape[1]} columns")
    print(f"\nFiltered columns:")
    for i, col in enumerate(df_filtered.columns):
        print(f"  {i:3d}: {col}")
    
    # Group by prefix
    print(f"\nColumn groups:")
    pose_cols = [c for c in df_filtered.columns if c.startswith("POSE_")]
    left_hand_cols = [c for c in df_filtered.columns if c.startswith("LEFT_HAND_")]
    right_hand_cols = [c for c in df_filtered.columns if c.startswith("RIGHT_HAND_")]
    other_cols = [c for c in df_filtered.columns if not any(c.startswith(p) for p in ["POSE_", "LEFT_HAND_", "RIGHT_HAND_"])]
    
    print(f"  POSE columns: {len(pose_cols)}")
    print(f"  LEFT_HAND columns: {len(left_hand_cols)}")
    print(f"  RIGHT_HAND columns: {len(right_hand_cols)}")
    print(f"  Other columns: {len(other_cols)}")
    
    return df_filtered

if __name__ == "__main__":
    # Try to find a sample CSV file
    sample_paths = [
        "recorded_videos_organized_data",
        "segmented_pose_hands_landmarks",
        "segmented_pose_hands_landmarks_fixed",
    ]
    
    print("Looking for sample CSV files to analyze structure...")
    for base_path in sample_paths:
        if os.path.exists(base_path):
            print(f"\nFound directory: {base_path}")
            # Look for any CSV file
            for root, dirs, files in os.walk(base_path):
                for file in files:
                    if file.endswith(".csv"):
                        csv_path = os.path.join(root, file)
                        analyze_csv_structure(csv_path)
                        print("\n" + "="*70)
                        print("ANALYSIS COMPLETE")
                        print("="*70)
                        exit(0)
    
    print("No CSV files found. Please provide a path to a sample CSV file.")
    print("\nUsage: python match_training_features.py <path_to_csv_file>")


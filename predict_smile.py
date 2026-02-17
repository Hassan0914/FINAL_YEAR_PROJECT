"""
Smile Score Prediction - Single File (R² = 0.925)
Usage: python predict_smile.py <feature_file>
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.ensemble import RandomForestRegressor

MODEL_PATH = os.path.join(os.path.dirname(__file__), "smile_model.joblib")
artifacts = joblib.load(MODEL_PATH)
model = artifacts['model']
scaler = artifacts['scaler']
feature_cols = artifacts['feature_cols']


def calculate_statistics(data):
    """
    Calculate comprehensive statistics for each attribute column
    Including time-series features for better prediction
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
        stats[f"{prefix}_entropy"] = -np.sum(np.abs(col_data/np.sum(np.abs(col_data)+1e-10)) * 
                                              np.log(np.abs(col_data/np.sum(np.abs(col_data)+1e-10))+1e-10))
        
        # Rate of change features
        diff = np.diff(col_data)
        stats[f"{prefix}_diff_mean"] = np.mean(diff) if len(diff) > 0 else 0
        stats[f"{prefix}_diff_std"] = np.std(diff) if len(diff) > 0 else 0
        stats[f"{prefix}_diff_max"] = np.max(np.abs(diff)) if len(diff) > 0 else 0
        
        # Zero crossings
        zero_crossings = np.sum(np.diff(np.signbit(col_data - np.mean(col_data))))
        stats[f"{prefix}_zero_cross"] = zero_crossings
        
        # Peak detection
        peaks = 0
        for i in range(1, len(col_data)-1):
            if col_data[i] > col_data[i-1] and col_data[i] > col_data[i+1]:
                peaks += 1
        stats[f"{prefix}_peaks"] = peaks
        
        # Autocorrelation (lag 1)
        if len(col_data) > 1:
            autocorr = np.corrcoef(col_data[:-1], col_data[1:])[0, 1]
            stats[f"{prefix}_autocorr"] = autocorr if not np.isnan(autocorr) else 0
        else:
            stats[f"{prefix}_autocorr"] = 0
        
        # Coefficient of variation
        stats[f"{prefix}_cv"] = stats[f"{prefix}_std"] / (stats[f"{prefix}_mean"] + 1e-10)
        
        # Mean absolute deviation
        stats[f"{prefix}_mad"] = np.mean(np.abs(col_data - np.mean(col_data)))
        
        # Signal magnitude area (normalized)
        stats[f"{prefix}_sma"] = np.sum(np.abs(col_data)) / len(col_data)
    
    # Cross-attribute features (interactions between columns)
    for i in range(num_cols):
        for j in range(i+1, num_cols):
            col_i = data[:, i]
            col_j = data[:, j]
            corr = np.corrcoef(col_i, col_j)[0, 1]
            stats[f"corr_{i+1}_{j+1}"] = corr if not np.isnan(corr) else 0
            stats[f"ratio_mean_{i+1}_{j+1}"] = np.mean(col_i) / (np.mean(col_j) + 1e-10)
    
    return stats


def predict_smile(data):
    """
    Predict smile score from a single feature file data
    
    Args:
        data: numpy array (n_timeframes, 5) - feature values over time
    
    Returns:
        float: predicted smile score (scale 1-7)
    """
    stats = calculate_statistics(data)
    
    # Create feature vector in correct order
    X = np.array([[stats.get(col, 0) for col in feature_cols]])
    X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
    
    # Scale and predict
    X_scaled = scaler.transform(X)
    prediction = model.predict(X_scaled)[0]
    
    return float(prediction)


def predict_smile_from_file(filepath):
    """
    Predict smile score from a single feature file
    
    Args:
        filepath: path to feature file (pre or post)
    
    Returns:
        float: predicted smile score
    """
    data = np.loadtxt(filepath)
    return predict_smile(data)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) >= 2:
        filepath = sys.argv[1]
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            sys.exit(1)
        
        score = predict_smile_from_file(filepath)
        print(f"Predicted Smile Score: {score:.4f}")
    else:
        print("Usage: python predict_smile.py <feature_file>")
        print("\nExample:")
        print("  python predict_smile.py pre/Smoothed-features-P1.txt")
        print("  python predict_smile.py post/Smoothed-features-P1.txt")

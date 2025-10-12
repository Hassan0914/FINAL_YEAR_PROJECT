#!/usr/bin/env python3
"""
Startup script for the Python API server
Run this script to start the gesture prediction API server
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def check_dependencies():
    """Check if required Python packages are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'opencv-python', 'mediapipe', 
        'pandas', 'numpy', 'scikit-learn', 'joblib'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(" Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n Installing missing packages...")
        
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_packages)
            print(" All packages installed successfully!")
        except subprocess.CalledProcessError as e:
            print(f" Failed to install packages: {e}")
            return False
    
    return True

def check_models():
    """Check if trained models are available"""
    models_dir = Path("final_trained_models")
    required_models = [
        "hidden_hands_score_model.joblib",
        "hands_on_table_score_model.joblib", 
        "gestures_on_table_score_model.joblib",
        "other_gestures_score_model.joblib",
        "self_touch_score_model.joblib"
    ]
    
    missing_models = []
    for model in required_models:
        if not (models_dir / model).exists():
            missing_models.append(model)
    
    if missing_models:
        print(" Missing trained models:")
        for model in missing_models:
            print(f"   - {model}")
        print("\n  Please ensure all model files are in the 'final_trained_models' directory")
        return False
    
    print(" All trained models found!")
    return True

def start_api_server():
    """Start the FastAPI server"""
    print(" Starting Gesture Prediction API Server...")
    print(" Server will be available at: http://localhost:8000")
    print(" API Documentation: http://localhost:8000/docs")
    print(" Health Check: http://localhost:8000/health")
    print("\n" + "="*60)
    
    try:
        # Start the server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "api_server:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n Server stopped by user")
    except Exception as e:
        print(f" Error starting server: {e}")

def main():
    """Main startup function"""
    print(" GESTURE PREDICTION API STARTUP")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("api_server.py").exists():
        print(" api_server.py not found in current directory")
        print("   Please run this script from the project root directory")
        return
    
    # Check dependencies
    print(" Checking dependencies...")
    if not check_dependencies():
        return
    
    # Check models
    print(" Checking trained models...")
    if not check_models():
        return
    
    print("\n All checks passed!")
    print("\n Next steps:")
    print("   1. This script will start the Python API server")
    print("   2. In another terminal, run: npm run dev")
    print("   3. Open http://localhost:3000 in your browser")
    print("   4. Upload a video to test the gesture analysis")
    
    input("\nPress Enter to start the API server...")
    
    # Start the server
    start_api_server()

if __name__ == "__main__":
    main()



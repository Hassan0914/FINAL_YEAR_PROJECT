#!/usr/bin/env python3
"""
Flask API Startup Script for Gesture Analysis
This script starts the Flask API server for gesture analysis.
"""

import os
import sys
import subprocess
import time

def check_dependencies():
    """Check if required dependencies are installed"""
    try:
        import flask
        import flask_cors
        import mediapipe
        import cv2
        import numpy
        import pandas
        print("✅ All dependencies are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please install dependencies with: pip install -r gesture_analysis_api/requirements.txt")
        return False

def start_flask_api():
    """Start the Flask API server"""
    print("🚀 Starting Flask Gesture Analysis API...")
    
    # Change to the gesture_analysis_api directory
    api_dir = os.path.join(os.getcwd(), 'gesture_analysis_api')
    if not os.path.exists(api_dir):
        print(f"❌ Flask API directory not found: {api_dir}")
        return False
    
    os.chdir(api_dir)
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Check if app.py exists
    if not os.path.exists('app.py'):
        print("❌ app.py not found in gesture_analysis_api directory")
        return False
    
    # Start the Flask server
    try:
        print("🌐 Starting Flask server on http://localhost:5000")
        print("📡 Available endpoints:")
        print("   GET  /health - Health check")
        print("   POST /analyze_gesture - Analyze video and get scores")
        print("   POST /features - Get detailed feature information")
        print("\n" + "="*50)
        
        # Run the Flask app
        subprocess.run([sys.executable, 'app.py'], check=True)
        
    except KeyboardInterrupt:
        print("\n🛑 Flask API server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting Flask API: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    
    return True

def main():
    """Main function"""
    print("🎯 Flask Gesture Analysis API Startup")
    print("="*50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Start Flask API
    if not start_flask_api():
        sys.exit(1)

if __name__ == "__main__":
    main()





#!/usr/bin/env python3
"""
Test script for the Gesture Prediction API
This script tests the complete pipeline from video upload to gesture prediction
"""

import requests
import json
import time
import os

def test_gesture_api():
    """Test the gesture prediction API"""
    
    # API endpoint
    api_url = "http://localhost:8000"
    
    print("🧪 TESTING GESTURE PREDICTION API")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing health check...")
    try:
        response = requests.get(f"{api_url}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health check passed: {health_data}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Gesture descriptions
    print("\n2. Testing gesture descriptions...")
    try:
        response = requests.get(f"{api_url}/gesture-descriptions")
        if response.status_code == 200:
            desc_data = response.json()
            print(f"✅ Gesture descriptions: {desc_data['descriptions']}")
        else:
            print(f"❌ Gesture descriptions failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Gesture descriptions error: {e}")
    
    # Test 3: Video prediction
    print("\n3. Testing video prediction...")
    
    # Check if we have a test video file
    test_video_path = "test_video.mp4"  # You can replace this with any video file
    
    if not os.path.exists(test_video_path):
        print(f"⚠️  Test video not found: {test_video_path}")
        print("   Please place a test video file named 'test_video.mp4' in the current directory")
        print("   Or update the test_video_path variable in this script")
        return False
    
    try:
        print(f"📹 Uploading video: {test_video_path}")
        
        with open(test_video_path, 'rb') as video_file:
            files = {'file': (test_video_path, video_file, 'video/mp4')}
            
            print("⏳ Processing video (this may take 3-5 minutes for MediaPipe extraction)...")
            start_time = time.time()
            
            response = requests.post(f"{api_url}/predict-gestures", files=files)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Video prediction successful!")
                print(f"⏱️  Processing time: {processing_time:.2f} seconds")
                print(f"📊 Results:")
                print(f"   Gesture Scores: {result['gesture_scores']}")
                print(f"   Voice Scores: {result['voice_scores']}")
                print(f"   Frame Count: {result['frame_count']}")
                print(f"   Message: {result['message']}")
                return True
            else:
                print(f"❌ Video prediction failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Video prediction error: {e}")
        return False

def main():
    """Main test function"""
    print("Starting Gesture API Test...")
    print("Make sure the API server is running on http://localhost:8000")
    print("You can start it with: python simple_api_server.py")
    print()
    
    success = test_gesture_api()
    
    if success:
        print("\n🎉 ALL TESTS PASSED!")
        print("The gesture prediction API is working correctly.")
    else:
        print("\n❌ SOME TESTS FAILED!")
        print("Please check the error messages above and fix the issues.")

if __name__ == "__main__":
    main()




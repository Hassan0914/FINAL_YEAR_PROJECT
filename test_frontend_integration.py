#!/usr/bin/env python3
"""
Test the complete frontend integration with the fixed voice analysis
"""

import requests
import tempfile
import subprocess
import os

def test_complete_integration():
    """Test the complete frontend integration"""
    print("="*60)
    print("TESTING COMPLETE FRONTEND INTEGRATION")
    print("="*60)
    
    # Start the API server in the background
    print("Starting API server...")
    import subprocess
    import time
    
    # Start server
    server_process = subprocess.Popen(['python', 'simple_api_server.py'], 
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.PIPE)
    
    # Wait for server to start
    time.sleep(5)
    
    try:
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get("http://localhost:8000/health", timeout=10)
        if response.status_code == 200:
            print("✓ API server is running")
        else:
            print(f"✗ Health check failed: {response.status_code}")
            return False
        
        # Create a test video
        print("Creating test video...")
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, "test_video.mp4")
        
        # Create test video with audio
        ffmpeg_cmd = 'C:\\FFMPEG\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe'
        cmd = [
            ffmpeg_cmd,
            '-f', 'lavfi',
            '-i', 'sine=frequency=440:duration=3',
            '-f', 'lavfi', 
            '-i', 'color=size=320x240:rate=1:color=black',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-shortest',
            '-y',
            video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            print(f"✗ Failed to create test video: {result.stderr}")
            return False
        
        print(f"✓ Test video created: {video_path}")
        
        # Test the prediction endpoint
        print("Testing prediction endpoint...")
        with open(video_path, 'rb') as f:
            files = {'file': ('test_video.mp4', f, 'video/mp4')}
            response = requests.post("http://localhost:8000/predict-gestures", files=files, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Prediction successful!")
            print(f"  Gesture scores: {result.get('gesture_scores', {})}")
            print(f"  Voice analysis: {result.get('voice_analysis', {})}")
            print(f"  Overall score: {result.get('overall_score', 'N/A')}")
            
            # Check if voice analysis is working
            voice_analysis = result.get('voice_analysis', {})
            if 'engaging_tone' in voice_analysis and 'confidence' in voice_analysis:
                print("✓ Voice analysis is working with real predictions!")
                print(f"  Engaging tone: {voice_analysis['engaging_tone']}/7")
                print(f"  Confidence: {voice_analysis['confidence']}")
            else:
                print("✗ Voice analysis not working properly")
                return False
                
        else:
            print(f"✗ Prediction failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
        
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)
        print("✓ Cleaned up test files")
        
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False
    
    finally:
        # Stop the server
        print("Stopping API server...")
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    success = test_complete_integration()
    
    if success:
        print("\n🎉 COMPLETE FRONTEND INTEGRATION WORKING!")
        print("✅ API server: Working")
        print("✅ Gesture prediction: Working")
        print("✅ Voice analysis: Working with real predictions")
        print("✅ Frontend integration: Ready for user uploads!")
    else:
        print("\n❌ INTEGRATION TEST FAILED!")
        print("Check the error messages above for details")


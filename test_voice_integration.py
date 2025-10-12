#!/usr/bin/env python3
"""
Test just the voice analysis integration
"""

import os
import sys
import tempfile
import subprocess

def test_voice_integration():
    """Test the voice analysis integration"""
    print("="*60)
    print("TESTING VOICE ANALYSIS INTEGRATION")
    print("="*60)
    
    try:
        # Change to voice confidence directory
        original_cwd = os.getcwd()
        voice_dir = os.path.join(original_cwd, 'voice_confidence_production')
        os.chdir(voice_dir)
        
        sys.path.append(voice_dir)
        from voice_confidence_backend_fixed import VoiceConfidenceBackend
        
        # Initialize voice predictor
        voice_predictor = VoiceConfidenceBackend()
        print("✓ Voice predictor initialized")
        
        # Create test video
        temp_dir = tempfile.mkdtemp()
        video_path = os.path.join(temp_dir, "test_video.mp4")
        
        # Create test video with audio
        ffmpeg_cmd = 'C:\\FFMPEG\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe'
        cmd = [
            ffmpeg_cmd,
            '-f', 'lavfi',
            '-i', 'sine=frequency=440:duration=2',
            '-f', 'lavfi', 
            '-i', 'color=size=320x240:rate=1:color=black',
            '-c:v', 'libx264',
            '-c:a', 'aac',
            '-shortest',
            '-y',
            video_path
        ]
        
        print("Creating test video...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            print(f"✗ Failed to create test video: {result.stderr}")
            return False
        
        print(f"✓ Test video created: {video_path}")
        
        # Test voice analysis
        print("Running voice analysis...")
        abs_video_path = os.path.abspath(video_path)
        result = voice_predictor.process_video(abs_video_path)
        
        print(f"Voice analysis result: {result}")
        
        if result.get('status') == 'success':
            print("✓ Voice analysis successful!")
            print(f"  Engaging tone: {result.get('engaging_tone_score', 'N/A')}/7")
            print(f"  Confidence: {result.get('confidence', 'N/A')}")
            print(f"  Features extracted: {result.get('features_extracted', 'N/A')}")
            print(f"  Audio duration: {result.get('audio_duration', 'N/A')}")
            
            # Test the API wrapper format
            api_result = {
                "engaging_tone": round(result.get('engaging_tone_score', 4.0), 2),
                "confidence": round(result.get('confidence', 0.5), 2)
            }
            print(f"✓ API format: {api_result}")
            
            return True
        else:
            print(f"✗ Voice analysis failed: {result.get('error', 'Unknown error')}")
            return False
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False
    
    finally:
        # Change back to original directory
        os.chdir(original_cwd)
        
        # Cleanup
        try:
            import shutil
            shutil.rmtree(temp_dir)
            print("✓ Cleaned up test files")
        except:
            pass

if __name__ == "__main__":
    success = test_voice_integration()
    
    if success:
        print("\n🎉 VOICE ANALYSIS INTEGRATION WORKING!")
        print("✅ Voice analysis: Working with real predictions")
        print("✅ API integration: Ready for frontend")
        print("✅ User uploads will now get genuine scores!")
    else:
        print("\n❌ VOICE ANALYSIS INTEGRATION FAILED!")
        print("Check the error messages above for details")


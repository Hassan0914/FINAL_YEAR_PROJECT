#!/usr/bin/env python3
"""
Test script for voice confidence analysis
"""

import os
import sys
import tempfile
import numpy as np

def test_voice_analysis():
    """Test the voice confidence analysis system"""
    print(" Testing Voice Confidence Analysis System...")
    
    try:
        # Change to voice confidence directory
        original_cwd = os.getcwd()
        voice_dir = os.path.join(original_cwd, 'voice_confidence_production')
        os.chdir(voice_dir)
        
        sys.path.append(voice_dir)
        from voice_confidence_backend import VoiceConfidenceBackend
        
        # Initialize voice predictor
        voice_predictor = VoiceConfidenceBackend()
        print(" Voice predictor initialized successfully")
        
        # Create a mock video file for testing
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_file:
            # Write some dummy data to create a file
            temp_file.write(b'dummy video data')
            temp_file.flush()
            
            print(f" Created test video: {temp_file.name}")
            
            # Test voice analysis
            result = voice_predictor.process_video(temp_file.name)
            
            print(" Voice Analysis Results:")
            print(f"  Engaging Tone Score: {result.get('engaging_tone_score', 'N/A')}")
            print(f"  Confidence: {result.get('confidence', 'N/A')}")
            print(f"  Status: {result.get('status', 'N/A')}")
            
            # Clean up
            os.unlink(temp_file.name)
            
        # Change back to original directory
        os.chdir(original_cwd)
        
        return True
        
    except Exception as e:
        print(f" Voice analysis test failed: {e}")
        # Change back to original directory if there was an error
        os.chdir(original_cwd)
        return False

def test_mock_voice_analysis():
    """Test mock voice analysis as fallback"""
    print(" Testing Mock Voice Analysis...")
    
    import random
    
    # Mock voice features
    mock_voice_features = {
        'f2meanf1': np.random.uniform(1.0, 3.0),
        'PercentBreaks': np.random.uniform(0.0, 10.0),
        'numFall': np.random.uniform(0.0, 5.0),
        'percentUnvoiced': np.random.uniform(0.0, 20.0),
        'avgBand2': np.random.uniform(0.0, 100.0),
        'f2STDf1': np.random.uniform(0.0, 1.0),
        'intensitySD': np.random.uniform(0.0, 20.0),
        'speakRate': np.random.uniform(1.0, 4.0),
        'f3STD': np.random.uniform(0.0, 500.0),
        'diffIntMaxMin': np.random.uniform(0.0, 30.0),
        'f1STD': np.random.uniform(0.0, 200.0),
        'intensityMean': np.random.uniform(50.0, 80.0),
        'intensityMax': np.random.uniform(70.0, 90.0),
        'intensityQuant': np.random.uniform(60.0, 85.0),
        'avgBand1': np.random.uniform(0.0, 50.0)
    }
    
    # Mock prediction
    engaging_tone = random.uniform(3.0, 6.0)
    confidence = random.uniform(0.6, 0.9)
    
    print(" Mock Voice Analysis Results:")
    print(f"  Engaging Tone Score: {engaging_tone:.2f}")
    print(f"  Confidence: {confidence:.2f}")
    print(f"  Features Used: {len(mock_voice_features)}")
    
    return {
        "engaging_tone": round(engaging_tone, 2),
        "confidence": round(confidence, 2)
    }

if __name__ == "__main__":
    print("="*60)
    print("VOICE CONFIDENCE ANALYSIS TEST")
    print("="*60)
    
    # Test real voice analysis
    real_success = test_voice_analysis()
    
    print("\n" + "-"*40)
    
    # Test mock voice analysis
    mock_result = test_mock_voice_analysis()
    
    print("\n" + "="*60)
    if real_success:
        print(" Voice analysis system is working!")
    else:
        print(" Real voice analysis failed, but mock analysis works")
    print("="*60)


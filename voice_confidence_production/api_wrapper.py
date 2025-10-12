#!/usr/bin/env python3
"""
API Wrapper for Voice Confidence Backend
Simple interface for frontend integration
"""

import os
import sys
import json
from voice_confidence_backend import VoiceConfidenceBackend

def predict_voice_confidence(video_path: str) -> dict:
    """
    Simple API function for frontend integration.
    
    Args:
        video_path (str): Path to uploaded video file
        
    Returns:
        dict: Prediction results with EngagingTone score
    """
    try:
        # Initialize backend
        backend = VoiceConfidenceBackend()
        
        # Process video
        result = backend.process_video(video_path)
        
        # Return clean results for frontend
        return {
            'success': result['status'] == 'success',
            'engaging_tone_score': round(result['engaging_tone_score'], 2),
            'confidence': round(result['confidence'], 2),
            'message': 'Voice confidence prediction completed' if result['status'] == 'success' else 'Prediction failed',
            'error': result.get('error', None)
        }
        
    except Exception as e:
        return {
            'success': False,
            'engaging_tone_score': 4.0,
            'confidence': 0.0,
            'message': 'System error occurred',
            'error': str(e)
        }

def main():
    """Test the API wrapper."""
    if len(sys.argv) != 2:
        print("Usage: python api_wrapper.py <video_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    result = predict_voice_confidence(video_path)
    
    # Print JSON result for frontend
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()

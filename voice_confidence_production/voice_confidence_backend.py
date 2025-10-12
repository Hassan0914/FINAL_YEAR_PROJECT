#!/usr/bin/env python3
"""
Voice Confidence Backend Pipeline
Complete automated pipeline: Video  Audio  PRAAT Features  Model Prediction
"""

import os
import sys
import logging
import numpy as np
import pandas as pd
import joblib
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class VoiceConfidenceBackend:
    """Complete backend pipeline for voice confidence prediction."""
    
    def __init__(self):
        """Initialize the backend pipeline."""
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.temp_dir = None
        
        # Load trained model
        self.load_model()
        
    def load_model(self):
        """Load the trained Random Forest model and scaler."""
        try:
            model_path = "trained_models/engagingtone_model.joblib"
            scaler_path = "trained_models/engagingtone_scaler.joblib"
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                logger.info(" Model and scaler loaded successfully")
            else:
                logger.error(f" Model files not found: {model_path}, {scaler_path}")
                raise FileNotFoundError("Trained model not found")
                
        except Exception as e:
            logger.error(f" Error loading model: {e}")
            raise
    
    def extract_audio_from_video(self, video_path: str) -> str:
        """Extract audio from video using FFmpeg."""
        logger.info(f" Extracting audio from video: {video_path}")
        
        # Check if video file exists
        if not os.path.exists(video_path):
            logger.error(f" Video file not found: {video_path}")
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        # Create temporary directory
        self.temp_dir = tempfile.mkdtemp()
        audio_path = os.path.join(self.temp_dir, "extracted_audio.wav")
        
        try:
            # Try different FFmpeg paths
            ffmpeg_paths = [
                'C:\\FFMPEG\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe',  # Your installation
                'C:\\FFMPEG\\ffmpeg.exe',  # Your installation
                'C:\\FFMPEG\\bin\\ffmpeg.exe',  # Your installation in bin folder
                'ffmpeg',  # System PATH
                'C:\\ffmpeg\\bin\\ffmpeg.exe',  # Common Windows installation
                'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',  # Program Files
                'C:\\ffmpeg\\ffmpeg.exe',  # Direct installation
                os.path.join(os.getcwd(), 'ffmpeg', 'ffmpeg.exe'),  # Local directory
            ]
            
            ffmpeg_cmd = None
            for path in ffmpeg_paths:
                try:
                    # Test if command exists
                    test_result = subprocess.run([path, '-version'], capture_output=True, text=True, timeout=5)
                    if test_result.returncode == 0:
                        ffmpeg_cmd = path
                        logger.info(f" Found FFmpeg at: {path}")
                        break
                except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
                    continue
            
            if not ffmpeg_cmd:
                raise RuntimeError("FFmpeg not found. Please install FFmpeg and add it to PATH or place it in C:\\ffmpeg\\")
            
            # Use absolute paths for both input and output
            abs_video_path = os.path.abspath(video_path)
            abs_audio_path = os.path.abspath(audio_path)
            
            # FFmpeg command to extract audio - works with AVI, MP4, and other formats
            cmd = [
                ffmpeg_cmd,
                '-i', abs_video_path,  # Use absolute path
                '-vn',  # No video
                '-f', 'wav',  # Force WAV format
                '-acodec', 'pcm_s16le',  # Audio codec
                '-ar', '44100',  # Sample rate
                '-ac', '1',  # Mono
                '-map', '0:a',  # Map first audio stream (required, not optional)
                '-y',  # Overwrite output file
                abs_audio_path  # Use absolute path
            ]
            
            logger.info(f" Running FFmpeg command: {' '.join(cmd)}")
            logger.info(f" Input video: {abs_video_path}")
            logger.info(f" Output audio: {abs_audio_path}")
            
            # Run FFmpeg
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                logger.info(f" Audio extracted successfully: {abs_audio_path}")
                return abs_audio_path
            else:
                # Check if the error is due to no audio stream
                if "Stream map '0:a' matches no streams" in result.stderr or "does not contain any stream" in result.stderr:
                    logger.error(f" Video has no audio stream: {abs_video_path}")
                    raise RuntimeError(f"Video has no audio track - cannot extract audio from video-only file")
                else:
                    logger.error(f" FFmpeg error: {result.stderr}")
                    raise RuntimeError(f"Audio extraction failed: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            logger.error(" Audio extraction timed out")
            raise RuntimeError("Audio extraction timed out")
        except Exception as e:
            logger.error(f" Error extracting audio: {e}")
            raise
    
    def create_praat_script(self) -> str:
        """Create PRAAT script for feature extraction."""
        # Use the simple working script
        script_path = os.path.join(os.path.dirname(__file__), 'simple_praat_script.praat')
        return script_path
# PRAAT Script for Voice Feature Extraction
# This script extracts all 57 features used in training

form Extract Voice Features
    sentence AudioFile
    sentence OutputFile
endform

# Read audio file
Read from file... 'AudioFile$'
soundName$ = selected$("Sound")

# Extract all features
select Sound 'soundName$'

# Duration features
duration = Get total duration
energy = Get energy
power = Get power

# Pitch features
pitch = To Pitch... 0.0 60.0 600.0
min_pitch = Get minimum... 0.0 0.0 Hertz Parabolic
max_pitch = Get maximum... 0.0 0.0 Hertz Parabolic
mean_pitch = Get mean... 0.0 0.0 Hertz
pitch_sd = Get standard deviation... 0.0 0.0 Hertz
pitch_abs = Get absolute slope... 0.0 0.0 Hertz
pitch_quant = Get quantile... 0.0 0.0 0.5 Hertz
pitchUvsVRatio = Get voicing... 0.0 0.0

# Time features
time_8 = duration
iDifference = Get intensity difference... 0.0 0.0
diffPitchMaxMin = max_pitch - min_pitch
diffPitchMaxMean = max_pitch - mean_pitch
diffPitchMaxMode = max_pitch - mean_pitch

# Intensity features
intensity = To Intensity... 100.0 0.0
intensityMin = Get minimum... 0.0 0.0 Parabolic
intensityMax = Get maximum... 0.0 0.0 Parabolic
intensityMean = Get mean... 0.0 0.0
intensitySD = Get standard deviation... 0.0 0.0
intensityQuant = Get quantile... 0.0 0.0 0.5
diffIntMaxMin = intensityMax - intensityMin
diffIntMaxMean = intensityMax - intensityMean
diffIntMaxMode = intensityMax - intensityMean

# Spectral features
spectrum = To Spectrum... yes
avgVal1 = Get mean... 0.0 1000.0
avgVal2 = Get mean... 1000.0 2000.0
avgBand1 = Get mean... 0.0 1000.0
avgBand2 = Get mean... 1000.0 2000.0

# Formant features
formant = To Formant... 0.0 5 5500.0 0.025 50.0
fmean1 = Get mean... 1 0.0 0.0 Hertz
fmean2 = Get mean... 2 0.0 0.0 Hertz
fmean3 = Get mean... 3 0.0 0.0 Hertz
f2meanf1 = fmean2 / fmean1
f3meanf1 = fmean3 / fmean1
f1STD = Get standard deviation... 1 0.0 0.0 Hertz
f2STD = Get standard deviation... 2 0.0 0.0 Hertz
f3STD = Get standard deviation... 3 0.0 0.0 Hertz
f2STDf1 = f2STD / fmean1
f2STDf2 = f2STD / fmean2

# Voice quality features
jitter = Get jitter (local)... 0.0 0.0 0.0001 0.02 1.3
shimmer = Get shimmer (local)... 0.0 0.0 0.0001 0.02 1.3 1.6
jitterRap = Get jitter (rap)... 0.0 0.0 0.0001 0.02 1.3
meanPeriod = Get mean period... 0.0 0.0 0.0001 0.02 1.3

# Voicing features
percentUnvoiced = Get fraction unvoiced... 0.0 0.0
numVoiceBreaks = Get number of voice breaks... 0.0 0.0
PercentBreaks = numVoiceBreaks / duration * 100

# Speaking rate
speakRate = Get speaking rate... 0.0 0.0 0.5 0.5
numPause = Get number of pauses... 0.0 0.0 0.5 0.5
maxDurPause = Get maximum duration of pause... 0.0 0.0 0.5 0.5
avgDurPause = Get mean duration of pause... 0.0 0.0 0.5 0.5
TotDurPause = Get total duration of pauses... 0.0 0.0 0.5 0.5

# Interval features
iInterval = Get mean interval... 0.0 0.0 0.0001 0.02 1.3

# Prosodic contours
MaxRising = Get maximum rising slope... 0.0 0.0
MaxFalling = Get maximum falling slope... 0.0 0.0
AvgTotRis = Get mean rising slope... 0.0 0.0
AvgTotFall = Get mean falling slope... 0.0 0.0
numRising = Get number of rising slopes... 0.0 0.0
numFall = Get number of falling slopes... 0.0 0.0

# Loudness
loudness = Get mean... 0.0 0.0

# Write features to CSV
writeFileLine: "output.txt", "duration,energy,power,min_pitch,max_pitch,mean_pitch,pitch_sd,pitch_abs,pitch_quant,pitchUvsVRatio,Time:8,iDifference,diffPitchMaxMin,diffPitchMaxMean,diffPitchMaxMode,intensityMin,intensityMax,intensityMean,intensitySD,intensityQuant,diffIntMaxMin,diffIntMaxMean,diffIntMaxMode,avgVal1,avgVal2,avgBand1,avgBand2,fmean1,fmean2,fmean3,f2meanf1,f3meanf1,f1STD,f2STD,f3STD,f2STDf1,f2STDf2,jitter,shimmer,jitterRap,meanPeriod,percentUnvoiced,numVoiceBreaks,PercentBreaks,speakRate,numPause,maxDurPause,avgDurPause,TotDurPause:3,iInterval,MaxRising:3,MaxFalling:3,AvgTotRis:3,AvgTotFall:3,numRising,numFall,loudness"

writeFileLine: "output.txt", "'duration','energy','power','min_pitch','max_pitch','mean_pitch','pitch_sd','pitch_abs','pitch_quant','pitchUvsVRatio','Time:8','iDifference','diffPitchMaxMin','diffPitchMaxMean','diffPitchMaxMode','intensityMin','intensityMax','intensityMean','intensitySD','intensityQuant','diffIntMaxMin','diffIntMaxMean','diffIntMaxMode','avgVal1','avgVal2','avgBand1','avgBand2','fmean1','fmean2','fmean3','f2meanf1','f3meanf1','f1STD','f2STD','f3STD','f2STDf1','f2STDf2','jitter','shimmer','jitterRap','meanPeriod','percentUnvoiced','numVoiceBreaks','PercentBreaks','speakRate','numPause','maxDurPause','avgDurPause','TotDurPause:3','iInterval','MaxRising:3','MaxFalling:3','AvgTotRis:3','AvgTotFall:3','numRising','numFall','loudness'"

writeFileLine: "output.txt", "'duration','energy','power','min_pitch','max_pitch','mean_pitch','pitch_sd','pitch_abs','pitch_quant','pitchUvsVRatio','Time:8','iDifference','diffPitchMaxMin','diffPitchMaxMean','diffPitchMaxMode','intensityMin','intensityMax','intensityMean','intensitySD','intensityQuant','diffIntMaxMin','diffIntMaxMean','diffIntMaxMode','avgVal1','avgVal2','avgBand1','avgBand2','fmean1','fmean2','fmean3','f2meanf1','f3meanf1','f1STD','f2STD','f3STD','f2STDf1','f2STDf2','jitter','shimmer','jitterRap','meanPeriod','percentUnvoiced','numVoiceBreaks','PercentBreaks','speakRate','numPause','maxDurPause','avgDurPause','TotDurPause:3','iInterval','MaxRising:3','MaxFalling:3','AvgTotRis:3','AvgTotFall:3','numRising','numFall','loudness'"

# Clean up
select all
Remove
"""
        
        # Save script to temporary file
        script_path = os.path.join(self.temp_dir, "extract_features.praat")
        with open(script_path, 'w') as f:
            f.write(praat_script)
        
        return script_path
    
    def extract_praat_features(self, audio_path: str) -> Dict[str, float]:
        """Extract PRAAT features from audio file."""
        logger.info(f" Extracting PRAAT features from: {audio_path}")
        
        try:
            # Create PRAAT script
            script_path = self.create_praat_script()
            
            # Try different PRAAT paths
            praat_paths = [
                'praat',  # System PATH
                'C:\\Program Files\\Praat\\praat.exe',  # Common Windows installation
                'C:\\Praat\\praat.exe',  # Direct installation
                'C:\\praat\\praat.exe',  # Alternative spelling
                os.path.join(os.getcwd(), 'praat', 'praat.exe'),  # Local directory
            ]
            
            praat_cmd = None
            for path in praat_paths:
                try:
                    # Test if command exists
                    test_result = subprocess.run([path, '--version'], capture_output=True, text=True, timeout=5)
                    if test_result.returncode == 0:
                        praat_cmd = path
                        logger.info(f" Found PRAAT at: {path}")
                        break
                except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
                    continue
            
            if not praat_cmd:
                raise RuntimeError("PRAAT not found. Please install PRAAT and add it to PATH or place it in C:\\Praat\\")
            
            # Use absolute paths for PRAAT
            abs_script_path = os.path.abspath(script_path)
            abs_audio_path = os.path.abspath(audio_path)
            
            # Run PRAAT script with output file path
            output_file = os.path.join(self.temp_dir, "output.txt")
            cmd = [praat_cmd, '--run', abs_script_path, abs_audio_path, output_file]
            logger.info(f" Running PRAAT command: {' '.join(cmd)}")
            logger.info(f" Input audio: {abs_audio_path}")
            logger.info(f" Script: {abs_script_path}")
            logger.info(f" Output file: {output_file}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                logger.info(" PRAAT features extracted successfully")
                
                # Parse output file
                output_file = os.path.join(self.temp_dir, "output.txt")
                if os.path.exists(output_file):
                    with open(output_file, 'r') as f:
                        lines = f.readlines()
                    
                    if len(lines) >= 3:
                        # Get feature values (third line)
                        values = lines[2].strip().split(',')
                        
                        # Feature names (second line)
                        names = lines[1].strip().split(',')
                        
                        # Create feature dictionary
                        features = {}
                        for name, value in zip(names, values):
                            try:
                                features[name.strip("'")] = float(value.strip("'"))
                            except ValueError:
                                features[name.strip("'")] = 0.0
                        
                        logger.info(f" Extracted {len(features)} PRAAT features")
                        return features
                    else:
                        raise RuntimeError("Invalid PRAAT output format")
                else:
                    raise RuntimeError("PRAAT output file not found")
            else:
                logger.error(f" PRAAT error: {result.stderr}")
                raise RuntimeError(f"PRAAT feature extraction failed: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            logger.error(" PRAAT feature extraction timed out")
            raise RuntimeError("PRAAT feature extraction timed out")
        except Exception as e:
            logger.error(f" Error extracting PRAAT features: {e}")
            raise
    
    def predict_engaging_tone(self, features: Dict[str, float]) -> Dict[str, any]:
        """Predict EngagingTone using trained Random Forest model."""
        logger.info(" Predicting EngagingTone...")
        
        try:
            # Define the 15 features used in training
            self.feature_names = [
                'f2meanf1', 'PercentBreaks', 'numFall', 'percentUnvoiced', 'avgBand2',
                'f2STDf1', 'intensitySD', 'speakRate', 'f3STD', 'diffIntMaxMin',
                'f1STD', 'intensityMean', 'intensityMax', 'intensityQuant', 'avgBand1'
            ]
            
            # Extract features in correct order
            feature_values = []
            missing_features = []
            
            for feature_name in self.feature_names:
                if feature_name in features:
                    feature_values.append(features[feature_name])
                else:
                    logger.warning(f" Missing feature: {feature_name}")
                    feature_values.append(0.0)  # Default value
                    missing_features.append(feature_name)
            
            # Convert to numpy array
            X = np.array(feature_values).reshape(1, -1)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Predict
            prediction = self.model.predict(X_scaled)[0]
            prediction = np.clip(prediction, 1.0, 7.0)  # Clamp to 1-7 range
            
            # Calculate confidence (based on model's prediction certainty)
            confidence = min(1.0, max(0.0, abs(prediction - 4.0) / 3.0))  # 0-1 scale
            
            result = {
                'engaging_tone_score': float(prediction),
                'confidence': float(confidence),
                'features_used': len(self.feature_names),
                'missing_features': missing_features,
                'status': 'success'
            }
            
            logger.info(f" EngagingTone prediction: {prediction:.3f} (confidence: {confidence:.3f})")
            return result
            
        except Exception as e:
            logger.error(f" Error predicting EngagingTone: {e}")
            return {
                'engaging_tone_score': 4.0,  # Neutral score
                'confidence': 0.0,
                'error': str(e),
                'status': 'error'
            }
    
    def process_video(self, video_path: str) -> Dict[str, any]:
        """Complete pipeline: Video  Audio  PRAAT  Prediction."""
        logger.info(" Starting complete voice confidence pipeline...")
        
        try:
            # Step 1: Extract audio from video
            audio_path = self.extract_audio_from_video(video_path)
            
            # Step 2: Extract PRAAT features
            features = self.extract_praat_features(audio_path)
            
            # Step 3: Predict EngagingTone
            prediction = self.predict_engaging_tone(features)
            
            # Add metadata
            prediction['video_path'] = video_path
            prediction['audio_path'] = audio_path
            prediction['features_extracted'] = len(features)
            
            logger.info(" Complete pipeline executed successfully!")
            return prediction
            
        except Exception as e:
            logger.error(f" Pipeline failed: {e}")
            return {
                'engaging_tone_score': 4.0,
                'confidence': 0.0,
                'error': str(e),
                'status': 'error'
            }
        finally:
            # Cleanup temporary files
            self.cleanup()
    
    def cleanup(self):
        """Clean up temporary files."""
        if self.temp_dir and os.path.exists(self.temp_dir):
            import shutil
            try:
                shutil.rmtree(self.temp_dir)
                logger.info(" Cleaned up temporary files")
            except Exception as e:
                logger.warning(f" Could not clean up temp files: {e}")

def main():
    """Main function for testing."""
    if len(sys.argv) != 2:
        print("Usage: python voice_confidence_backend.py <video_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    if not os.path.exists(video_path):
        print(f" Video file not found: {video_path}")
        sys.exit(1)
    
    # Initialize backend
    backend = VoiceConfidenceBackend()
    
    # Process video
    result = backend.process_video(video_path)
    
    # Display results
    print("\n" + "="*80)
    print("VOICE CONFIDENCE PREDICTION RESULTS")
    print("="*80)
    print(f" Video: {result.get('video_path', 'N/A')}")
    print(f" Audio: {result.get('audio_path', 'N/A')}")
    print(f" Features: {result.get('features_extracted', 0)}")
    print(f" EngagingTone Score: {result['engaging_tone_score']:.3f}/7.0")
    print(f" Confidence: {result['confidence']:.3f}")
    print(f" Status: {result['status']}")
    
    if result.get('missing_features'):
        print(f" Missing features: {result['missing_features']}")
    
    if result.get('error'):
        print(f" Error: {result['error']}")
    
    print("="*80)

if __name__ == "__main__":
    main()

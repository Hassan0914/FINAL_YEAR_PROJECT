# Standalone Model Testing Guide

This guide explains how to test each AI model independently from the command line.

## 📁 Models Location

- **Gesture Analysis Model**: `Models/gesture analysis model/`
- **Smile/Facial Analysis Model**: `Models/smile model/`

---

## 🎯 Gesture Analysis Model

### Quick Test (Windows)

```cmd
cd "Models\gesture analysis model"
test_standalone.bat uploads\P70.avi
```

### Manual Test (Windows)

```cmd
cd "Models\gesture analysis model"

REM Activate virtual environment
venv\Scripts\activate

REM Run the model
python process_video.py uploads\P70.avi
```

### Manual Test (Linux/Mac)

```bash
cd "Models/gesture analysis model"

# Activate virtual environment
source venv/bin/activate

# Run the model
python process_video.py uploads/P70.avi
```

### What It Does

1. Loads the gesture recognition model (`gesture_model.h5`)
2. Extracts MediaPipe landmarks (pose + hands) from video frames
3. Makes predictions using sliding window approach
4. Calculates scores (1-7 scale) for each gesture type:
   - `self_touch`
   - `hands_on_table`
   - `hidden_hands`
   - `gestures_on_table`
   - `other_gestures`

### Expected Output

```
======================================================================
STEP 0: Loading model...
======================================================================
Loading model from: gesture_model.h5
Model loaded successfully!

======================================================================
STEP 1: Extracting landmarks from video
======================================================================
Video: P70.avi
Total frames: 1500
FPS: 30.00
Estimated duration: 50.00 seconds
...

======================================================================
FINAL RESULTS
======================================================================
Video: P70.avi
Total frames processed: 1500
Total predictions: 45

Scores (out of 7):
  self_touch          : 2.50
  hands_on_table      : 3.20
  hidden_hands        : 1.10
  gestures_on_table    : 4.80
  other_gestures      : 5.30
```

### Requirements

- Python 3.11+
- TensorFlow
- MediaPipe
- OpenCV
- NumPy

Install dependencies:
```cmd
cd "Models\gesture analysis model"
venv\Scripts\activate
pip install -r requirements.txt
```

---

## 😊 Smile/Facial Analysis Model

### Quick Test (Windows)

```cmd
cd "Models\smile model"
test_standalone.bat "C:\Videos\interview.mp4"
```

### Manual Test (Windows)

```cmd
cd "Models\smile model"

REM Activate virtual environment
venv\Scripts\activate

REM Run the model
python video_smile_pipeline.py "C:\Videos\interview.mp4"
```

### Manual Test (Linux/Mac)

```bash
cd "Models/smile model"

# Activate virtual environment
source venv/bin/activate

# Run the model
python video_smile_pipeline.py /path/to/video.mp4
```

### What It Does

1. Loads the smile prediction model (`smile_model.joblib`)
2. Extracts facial features from video frames using OpenCV
3. Calculates statistical features (160 features)
4. Predicts smile score (1-7 scale)

### Expected Output

```
[1/4] Opening video: interview.mp4
    Video: 900 frames, 30.0 FPS, 30.0 seconds

[2/4] Extracting SHORE features (every 3 frames)...
    Extracted features from 300 frames

[3/4] Calculating statistical features...
    Generated 160 statistical features

[4/4] Predicting smile score...

==================================================
RESULT: Smile Score = 5.42 / 7
        High - Good positive expressions
==================================================

Final Result: {
    'smile_score': 5.42,
    'frames_processed': 300,
    'video_duration_seconds': 30.0,
    'interpretation': 'High - Good positive expressions'
}
```

### Requirements

- Python 3.11+
- scikit-learn
- OpenCV
- NumPy
- Pandas
- joblib

Install dependencies:
```cmd
cd "Models\smile model"
venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🔧 Troubleshooting

### Error: "Model file not found"

**Gesture Model:**
- Ensure `gesture_model.h5` exists in `Models/gesture analysis model/`

**Smile Model:**
- Ensure `smile_model.joblib` exists in `Models/smile model/`

### Error: "No module named 'mediapipe'"

```cmd
cd "Models\gesture analysis model"
venv\Scripts\activate
pip install mediapipe opencv-python
```

### Error: "No module named 'sklearn'"

```cmd
cd "Models\smile model"
venv\Scripts\activate
pip install scikit-learn
```

### Error: "Video file not found"

- Use absolute path: `"C:\Videos\test.mp4"`
- Or relative path from model directory: `uploads\test.avi`
- Check file exists before running

### Error: "TensorFlow not found"

```cmd
cd "Models\gesture analysis model"
venv\Scripts\activate
pip install tensorflow
```

---

## 📝 Testing Checklist

- [ ] Gesture model loads successfully
- [ ] Gesture model processes video and outputs scores
- [ ] Smile model loads successfully
- [ ] Smile model processes video and outputs score
- [ ] Both models work with different video formats (MP4, AVI, MOV)
- [ ] Virtual environments are properly set up

---

## 🚀 Next Steps

After confirming both models work standalone:

1. **Update API routes** to use models from `Models/` folder
2. **Test API integration** with Next.js frontend
3. **Verify end-to-end flow** from video upload to results display

---

## 📞 Quick Reference

**Gesture Model:**
```cmd
cd "Models\gesture analysis model"
python process_video.py <video_path>
```

**Smile Model:**
```cmd
cd "Models\smile model"
python video_smile_pipeline.py <video_path>
```


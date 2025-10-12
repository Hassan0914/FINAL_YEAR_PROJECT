# 🎯 Gesture Analysis API

A professional Flask backend API for real-time gesture analysis using MediaPipe and custom feature engineering.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the API
```bash
python app.py
```

### 3. API will be available at:
- **Base URL:** `http://localhost:5000`
- **Health Check:** `GET /health`
- **Gesture Analysis:** `POST /analyze_gesture`
- **Feature Extraction:** `POST /features`

## 📡 API Endpoints

### 🏥 Health Check
```bash
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "message": "Gesture Analysis API is running",
  "version": "1.0.0"
}
```

### 🎬 Gesture Analysis
```bash
POST /analyze_gesture
```
**Request:** Upload video file (mp4, avi, mov, mkv, webm)

**Response:**
```json
{
  "status": "success",
  "video_name": "video.mp4",
  "scores": {
    "hidden_hands_score": 1.62,
    "hands_on_table_score": 4.55,
    "gestures_on_table_score": 0.26,
    "other_gestures_score": 0.57,
    "self_touch_score": 5.38
  },
  "rates": {
    "both_hands_hidden_rate": 0.231,
    "hands_on_table_rate": 0.650,
    "gestures_on_table_rate": 0.037,
    "other_gestures_rate": 0.082,
    "hand_detection_rate": 0.769
  },
  "message": "Gesture analysis completed successfully"
}
```

### 🔍 Feature Extraction
```bash
POST /features
```
**Request:** Upload video file

**Response:**
```json
{
  "status": "success",
  "video_name": "video.mp4",
  "features": {
    "left_openness_mean": 0.123,
    "right_openness_mean": 0.145,
    "hand_detection_rate": 0.769,
    "both_hands_hidden_rate": 0.231,
    "hands_on_table_rate": 0.650,
    "gestures_on_table_rate": 0.037,
    "other_gestures_rate": 0.082,
    "self_touch_score": 5.38
  },
  "feature_names": [
    "left_openness_mean",
    "left_openness_std",
    "left_openness_max",
    "right_openness_mean",
    "right_openness_std",
    "right_openness_max",
    "left_height_mean",
    "left_height_range",
    "right_height_mean",
    "right_height_range",
    "hand_detection_rate",
    "left_speed_mean",
    "right_speed_mean",
    "inter_hand_distance_mean",
    "inter_hand_distance_std",
    "total_openness",
    "avg_height",
    "height_difference",
    "left_height_std",
    "right_height_std",
    "table_proximity_left",
    "table_proximity_right",
    "both_hands_hidden_rate",
    "hands_on_table_rate",
    "gestures_on_table_rate",
    "other_gestures_rate",
    "mixed_hand_positions_rate"
  ],
  "message": "Feature extraction completed successfully"
}
```

## 🎯 Gesture Classes

The API analyzes 5 gesture classes:

1. **Hidden Hands** - When both hands are not detected
2. **Hands on Table** - When both hands are stationary near table level
3. **Gestures on Table** - When hands are moving near table level
4. **Other Gestures** - When hands are gesturing in the air
5. **Self Touch** - Overall hand detection rate

## 📊 Scoring System

- **Range:** 0.0 to 7.0
- **Method:** Direct scaling (Rate × 7.0 = Score)
- **Interpretation:**
  - 0.0-1.0: Very Low
  - 1.0-3.0: Low
  - 3.0-5.0: Medium
  - 5.0-7.0: High

## 🔧 Technical Details

- **Framework:** Flask with CORS support
- **ML Engine:** MediaPipe for hand detection
- **Feature Engineering:** Custom 27-feature extraction
- **Scoring:** Direct mathematical scaling
- **File Support:** mp4, avi, mov, mkv, webm
- **Processing:** Real-time video analysis

## 🌐 Frontend Integration

### JavaScript Example:
```javascript
const formData = new FormData();
formData.append('video', videoFile);

fetch('http://localhost:5000/analyze_gesture', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Gesture Scores:', data.scores);
  console.log('Raw Rates:', data.rates);
});
```

### React Example:
```jsx
const analyzeVideo = async (videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);
  
  const response = await fetch('http://localhost:5000/analyze_gesture', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.scores;
};
```

## 🚀 Production Deployment

For production, consider:
- Using Gunicorn instead of Flask dev server
- Adding authentication/API keys
- Implementing rate limiting
- Adding logging and monitoring
- Using a reverse proxy (nginx)

## 📝 Notes

- Videos are temporarily stored during processing
- Files are automatically cleaned up after analysis
- API supports CORS for frontend integration
- All processing happens server-side for security

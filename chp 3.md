# Chapter 3: Implementation

## 3.1 Implementation Details

This chapter explains the implementation of our AI-powered Interview Body Language Analysis System. The system analyzes recorded interview videos and provides detailed feedback on a candidate's gestures, hand positions, and facial expressions. It consists of three main parts: a web-based frontend built with Next.js, a Python backend that runs the AI models, and a PostgreSQL database that stores user data and analysis results.

The overall architecture follows a client-server model. The user interacts with the frontend (browser), which communicates with the Next.js API layer. The Next.js API layer then sends the uploaded video to the Python backend for AI processing. Once the backend finishes analyzing the video, it returns the scores back to the frontend, which saves them in the database and displays the results on a dashboard.

The diagram below shows how the different parts of the system connect:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────┐       ┌──────────────────┐       ┌──────────────┐    │
│   │   Browser    │──────▶│  Next.js Frontend │──────▶│  Python API  │    │
│   │   (React)    │◀──────│  (API Routes)     │◀──────│  (FastAPI)   │    │
│   │  Port: 3000  │       │  Port: 3000       │       │  Port: 8000  │    │
│   └─────────────┘       └────────┬───────────┘       └──────────────┘    │
│                                  │                                       │
│                                  │ Prisma ORM                            │
│                                  ▼                                       │
│                          ┌──────────────┐                                │
│                          │  PostgreSQL   │                                │
│                          │  Database     │                                │
│                          │  Port: 5432   │                                │
│                          └──────────────┘                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 3.1.1 Frontend (Next.js Web Application)

The frontend is a web application built using **Next.js 14** with the **App Router**. It is written in **TypeScript** and styled using **Tailwind CSS** with **Shadcn/ui** components for a clean, modern, and responsive user interface.

**Key Frontend Pages:**

| Page | Path | Purpose |
|------|------|---------|
| Home Page | `/` | Landing page with project info, features, and demo |
| Sign Up | `/auth/signup` | User registration with email and password |
| Login | `/auth/login` | User authentication |
| Email Verification | `/auth/verify` | 6-digit OTP verification after signup |
| Upload | `/upload` | Video upload with drag-and-drop support |
| Dashboard | `/dashboard` | Displays analysis results, charts, and feedback |
| History | `/history` | Lists all past analyses with scores |

**How the Frontend Works:**

1. **Landing Page:** When a user opens the application, they see the home page with a description of the system, feature cards, and buttons to upload a video or view the dashboard. If the user is not logged in, they are prompted to sign in.

2. **Video Upload:** The upload page allows users to drag and drop a video file or click to browse. Supported formats include MP4, AVI, and MOV. Once a file is selected, a preview is shown. When the user clicks "Analyze," the video is sent to the backend through the Next.js API route.

3. **Progress Display:** While the video is being processed, the user sees a progress bar and status messages such as "Uploading," "Processing," and "Analyzing."

4. **Dashboard:** After the analysis finishes, the user is redirected to the dashboard, which shows:
   - A **Score Gauge** with the overall performance score (out of 10)
   - A **Radar Chart** showing all gesture category scores
   - A **Bar Chart** for individual gesture scores
   - An **Accordion-based Feedback Section** with detailed explanations for each gesture category (Hands on Table, Hidden Hands, Gestures on Table, Self Touch)
   - A **Performance Chart** that shows trends over time
   - A list of **Recent Analyses**

5. **PDF Report:** Users can download a PDF report of their analysis using the built-in PDF generation feature (uses jsPDF library).

**UI Component Library:**

We used the **Shadcn/ui** component library, which provides pre-built, customizable components based on **Radix UI** primitives. Components used include:
- Cards, Buttons, Badges
- Accordion (for expandable feedback sections)
- Progress bar
- Tabs, Dialogs, Tooltips
- Charts (using Recharts library)

**Animations:**

We used **Framer Motion** for smooth page transitions and element animations throughout the application, giving it a polished feel.

---

### 3.1.2 Video Upload and Processing Pipeline

When a user uploads a video, the following steps happen in sequence:

```
┌──────────────────────────────────────────────────────────────────────┐
│                   VIDEO PROCESSING PIPELINE                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Step 1: User uploads video file (MP4/AVI/MOV)                       │
│          ↓                                                           │
│  Step 2: Next.js API route validates authentication and file type    │
│          ↓                                                           │
│  Step 3: Video is forwarded to Python backend (FastAPI)              │
│          ↓                                                           │
│  Step 4: Backend saves video to a temporary file                     │
│          ↓                                                           │
│  Step 5: MediaPipe extracts body landmarks from EVERY frame          │
│          ↓                                                           │
│  Step 6: BiLSTM model predicts gesture class for each 1-second       │
│          window (30 frames)                                          │
│          ↓                                                           │
│  Step 7: Scores are calculated using average softmax probabilities   │
│          ↓                                                           │
│  Step 8: Overall score is calculated using weighted fusion           │
│          ↓                                                           │
│  Step 9: Results are sent back to Next.js API route                  │
│          ↓                                                           │
│  Step 10: Next.js saves results to PostgreSQL database               │
│          ↓                                                           │
│  Step 11: Dashboard displays scores, charts, and feedback            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Next.js API Route (`/api/analyze-video`):**

This is the bridge between the frontend and the Python backend. It handles:
- Authenticating the user session
- Validating the uploaded file (must be a video, max 500MB)
- Forwarding the video to the Python backend using a `fetch` POST request
- Receiving the analysis results from the backend
- Saving the results to the PostgreSQL database
- Returning the results to the frontend

For very long videos (over 5 minutes), the processing can take several minutes. To handle this, we configured:
- **AbortController** with a 2-hour timeout on the frontend fetch
- **Uvicorn Keep-Alive** set to 3000 seconds on the backend
- **Database Recovery:** If the frontend connection times out but the backend completes, the system checks the database for recently completed analyses and returns them to the user

---

### 3.1.3 Backend API (Python FastAPI)

The backend is built with **FastAPI**, a modern Python web framework that is fast and easy to use. It runs on **Uvicorn**, an ASGI server.

**Backend Architecture:**

```
unified_models_api.py
├── Model Loaders
│   ├── load_gesture_model()     → Loads BiLSTM gesture model
│   └── load_smile_model()       → Loads smile detection model
├── Helper Functions
│   ├── save_uploaded_file()     → Saves video to temp location
│   └── cleanup_file()           → Deletes temp files after processing
├── API Endpoints
│   ├── GET  /                   → Root info
│   ├── GET  /api/health         → Health check
│   ├── POST /api/analyze-gesture → Gesture-only analysis
│   ├── POST /api/analyze-smile   → Smile-only analysis
│   └── POST /api/analyze-all     → Combined analysis (main endpoint)
└── Server Configuration
    └── Uvicorn with 3000s keep-alive, 10 concurrent connections
```

**How the Backend Processes a Video:**

When the backend receives a video through the `/api/analyze-all` endpoint:

1. **File Saving:** The uploaded video is saved to a temporary file on disk.
2. **Gesture Analysis:** The gesture analysis pipeline runs (explained in detail in Section 3.1.4).
3. **Smile Analysis:** The smile analysis pipeline runs (currently disabled due to NumPy version compatibility — see Section 3.1.5).
4. **Score Fusion:** If gesture analysis succeeds, the system calculates an overall score using a weighted fusion formula.
5. **Cleanup:** The temporary video file is deleted.
6. **Response:** The results are sent back as a JSON response.

**Server Configuration:**

| Setting | Value | Purpose |
|---------|-------|---------|
| Host | 0.0.0.0 | Accepts connections from any IP |
| Port | 8000 | Backend API port |
| Timeout Keep-Alive | 3000 seconds | Supports long video processing |
| Max Concurrency | 10 | Limits simultaneous requests |
| Max Requests | 1000 | Restarts worker to prevent memory leaks |

---

### 3.1.4 Gesture Analysis Pipeline

The gesture analysis is the core feature of the system. It uses **MediaPipe** for body and hand landmark detection and a **BiLSTM (Bidirectional Long Short-Term Memory)** deep learning model for classifying gestures.

**Step 1: Landmark Extraction**

Using Google's **MediaPipe** library, we extract body landmarks from every frame of the video:

- **Pose Landmarks:** 12 upper body landmarks (shoulders, elbows, wrists, fingers) × 4 values each (x, y, z, visibility) = **48 features**
- **Left Hand Landmarks:** 21 hand landmarks × 3 values each (x, y, z) = **63 features**
- **Right Hand Landmarks:** 21 hand landmarks × 3 values each (x, y, z) = **63 features**
- **Total per frame: 174 features**

```
┌────────────────────────────────────────────────────────────────────┐
│              LANDMARK EXTRACTION (per frame)                       │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Pose (12 landmarks × 4 values)     = 48 features                 │
│  ├── Left Shoulder (x, y, z, vis)                                  │
│  ├── Right Shoulder (x, y, z, vis)                                 │
│  ├── Left Elbow (x, y, z, vis)                                    │
│  ├── Right Elbow (x, y, z, vis)                                   │
│  ├── Left Wrist (x, y, z, vis)                                    │
│  ├── Right Wrist (x, y, z, vis)                                   │
│  └── ... (Left/Right Pinky, Index, Thumb)                          │
│                                                                    │
│  Left Hand (21 landmarks × 3 values) = 63 features                │
│  Right Hand (21 landmarks × 3 values) = 63 features               │
│                                                                    │
│  TOTAL = 48 + 63 + 63 = 174 features per frame                    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Step 2: Gesture Prediction**

The extracted landmarks are fed into the BiLSTM model in **non-overlapping windows of 30 frames** (which equals 1 second at 30 FPS). For each window:

1. The model outputs **softmax probabilities** for 4 gesture classes
2. The predicted class is the one with the highest probability

**Gesture Classes:**

| Class | Meaning |
|-------|---------|
| `hands_on_table` | Hands resting on the table (positive — shows confidence) |
| `hidden_hands` | Hands are hidden from view (negative — suggests nervousness) |
| `gestures_on_table` | Active gesturing while arms rest on table (negative — can be distracting) |
| `self_touch` | Touching face, hair, or body (negative — indicates anxiety) |

**Step 3: Score Calculation**

Scores are calculated using the **simple average probability** method:

1. Collect softmax probabilities for each class across all 1-second windows
2. Calculate the **average probability** for each class
3. **Score = Average Probability × 10** (giving a score out of 10)

For example, if a 10-second video produces these average probabilities:
- `hands_on_table`: 0.45 → Score: **4.50/10**
- `hidden_hands`: 0.20 → Score: **2.00/10**
- `gestures_on_table`: 0.25 → Score: **2.50/10**
- `self_touch`: 0.10 → Score: **1.00/10**

**Step 4: Weighted Fusion (Overall Score)**

The individual scores are combined into a single overall score using **research-based weights**:

```
┌──────────────────────────────────────────────────────────────────┐
│              WEIGHTED FUSION FORMULA                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overall = w1 × hands_on_table          (POSITIVE indicator)     │
│          + w2 × (10 - hidden_hands)     (NEGATIVE → inverted)    │
│          + w3 × (10 - gestures_on_table)(NEGATIVE → inverted)    │
│          + w4 × (10 - self_touch)       (NEGATIVE → inverted)    │
│                                                                  │
│  Weights (without smile):                                        │
│    hands_on_table   = 0.322 (32.2%)                              │
│    hidden_hands     = 0.264 (26.4%)                              │
│    gestures_on_table = 0.207 (20.7%)                             │
│    self_touch       = 0.207 (20.7%)                              │
│                                                                  │
│  Note: Negative indicators are inverted (10 - score) so that     │
│  a LOW score for negative gestures results in a HIGH overall.    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

For example:
- `hands_on_table` = 6.0 → 6.0 × 0.322 = 1.93
- `hidden_hands` = 2.0 → (10 - 2.0) × 0.264 = 2.11
- `gestures_on_table` = 3.0 → (10 - 3.0) × 0.207 = 1.45
- `self_touch` = 1.5 → (10 - 1.5) × 0.207 = 1.76
- **Overall Score = 1.93 + 2.11 + 1.45 + 1.76 = 7.25 / 10**

---

### 3.1.5 Smile and Facial Analysis

The system also includes a **smile detection model** that uses a pre-trained machine learning pipeline (saved as a `.joblib` file) to analyze facial expressions in the video. The smile model:

1. Processes each frame of the video
2. Detects facial features
3. Calculates a **smile score** (out of 10)
4. Provides an interpretation (e.g., "High — Good positive expressions")

**Note:** The smile model is currently disabled in the production build due to **NumPy version compatibility issues** between TensorFlow (requires NumPy 1.x) and the smile model (saved with NumPy 2.x). The system is designed to work with or without the smile model — when disabled, the overall score is calculated using only the gesture scores with adjusted weights.

When smile analysis is available, it is included in the weighted fusion with a weight of 0.13 (13%).

---

### 3.1.6 User Authentication and Security

Authentication is handled using **NextAuth.js** (version 4), which provides a complete authentication solution for Next.js applications.

**Authentication Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User signs up with email, password, and name                │
│     ↓                                                           │
│  2. Password is hashed using bcrypt (12 salt rounds)            │
│     ↓                                                           │
│  3. User record is saved in PostgreSQL database                 │
│     ↓                                                           │
│  4. 6-digit verification code is generated                      │
│     ↓                                                           │
│  5. Verification email is sent (via Nodemailer + Gmail SMTP)    │
│     ↓                                                           │
│  6. User enters the code on the verification page               │
│     ↓                                                           │
│  7. Account is verified and user can log in                     │
│     ↓                                                           │
│  8. On login, NextAuth creates a JWT token (valid for 30 days)  │
│     ↓                                                           │
│  9. JWT token is stored in browser cookie                       │
│     ↓                                                           │
│ 10. Protected routes check the JWT token via middleware          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Security Features:**

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcrypt with 12 salt rounds |
| Session Management | JWT tokens (30-day expiry) |
| Route Protection | NextAuth middleware on `/dashboard`, `/upload`, `/history` |
| Input Validation | Email format validation, password length check (min 6 chars) |
| CORS | Configured on FastAPI backend to allow frontend origin |
| Email Verification | 6-digit OTP with 10-minute expiry |

**Protected Routes:**

The middleware file (`middleware.ts`) checks every request to protected routes:
- `/dashboard` — requires authentication
- `/upload` — requires authentication
- `/history` — requires authentication
- `/analysis` — requires authentication

If a user tries to access these pages without being logged in, they are automatically redirected to the login page.

---

### 3.1.7 Database Design and Storage

We use **PostgreSQL** as the database and **Prisma ORM** for interacting with it from the Next.js application.

**Database Schema:**

```
┌────────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────┐                              │
│  │          users               │                              │
│  ├──────────────────────────────┤                              │
│  │ id          (String, PK)     │                              │
│  │ email       (String, Unique) │                              │
│  │ password    (String, Hashed) │                              │
│  │ name        (String, Null)   │                              │
│  │ isVerified  (Boolean)        │                              │
│  │ verificationCode (String)    │                              │
│  │ codeExpiresAt (DateTime)     │                              │
│  │ createdAt   (DateTime)       │                              │
│  │ updatedAt   (DateTime)       │                              │
│  └──────────────┬───────────────┘                              │
│                 │ 1:N (one user has many analyses)              │
│                 ▼                                               │
│  ┌──────────────────────────────┐                              │
│  │     analysis_history         │                              │
│  ├──────────────────────────────┤                              │
│  │ id             (String, PK)  │                              │
│  │ userId         (String, FK)  │                              │
│  │ videoName      (String)      │                              │
│  │ videoFileName  (String)      │                              │
│  │ handsOnTable   (Float)       │  ← Gesture Scores            │
│  │ hiddenHands    (Float)       │                              │
│  │ gestureOnTable (Float)       │                              │
│  │ selfTouch      (Float)       │                              │
│  │ smileScore     (Float)       │  ← Facial Score              │
│  │ finalScore     (Float)       │  ← Overall Score             │
│  │ gestureFrames  (Int)         │  ← Processing Metadata       │
│  │ facialFrames   (Int)         │                              │
│  │ processingTime (Float)       │                              │
│  │ gestureSuccess (Boolean)     │                              │
│  │ facialSuccess  (Boolean)     │                              │
│  │ createdAt      (DateTime)    │                              │
│  └──────────────────────────────┘                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Database Operations:**

1. **User Registration:** Creates a new user record with hashed password and verification code
2. **Analysis Save:** After video processing, all scores and metadata are saved to `analysis_history`
3. **History Retrieval:** Fetches paginated analysis records for the logged-in user
4. **Monthly Aggregation:** Groups analyses by month and calculates average scores for trend charts
5. **Analysis Deletion:** Users can delete their own past analyses (with ownership verification)

**Prisma ORM** generates a type-safe database client from the schema definition, which means every database query is checked at compile time, reducing the chance of bugs.

---

### 3.1.8 Dashboard and Results Display

The dashboard is the main results page where users can see their analysis scores and detailed feedback. It consists of several visual components:

**Score Gauge:**
A circular gauge that shows the overall score (out of 10) with color coding:
- Green (7–10): Good performance
- Yellow (4–7): Average performance
- Red (0–4): Needs improvement

**Radar Chart:**
A spider/radar chart that plots all four gesture category scores on axes, giving a visual overview of strengths and weaknesses.

**Bar Chart:**
A horizontal bar chart that shows individual gesture scores side by side, making it easy to compare categories.

**Feedback Accordion:**
An expandable accordion section that provides detailed text-based feedback for each gesture category. Each section explains:
- What the gesture category means
- What the user's score indicates
- Tips for improvement

**Performance Chart (History):**
A line chart that shows how the user's overall score has changed across multiple analyses, helping track improvement over time.

**Recent Analyses Table:**
A list of the user's most recent video analyses with dates, scores, and quick-view details.

---

### 3.1.9 PDF Report Generation

Users can download a professional PDF report of their analysis results. The PDF is generated server-side using the **jsPDF** library and includes:

- Overall performance score with visual representation
- Individual gesture category scores
- Score interpretation and feedback
- Analysis metadata (date, processing time, frames analyzed)

The PDF is styled to match the dashboard's dark theme, creating a consistent visual experience.

---

### 3.1.10 Analysis History and Trends

The system stores every analysis in the database, allowing users to:

1. **View Past Analyses:** Browse all previous video analyses with pagination (10 per page)
2. **Track Improvement:** See a performance trend chart that plots overall scores over time
3. **Monthly Statistics:** View average scores grouped by month
4. **Delete Records:** Remove unwanted analysis records

The history API (`/api/analysis-history`) supports two modes:
- **List Mode:** Returns paginated analysis records
- **Monthly Mode:** Returns aggregated statistics grouped by month

---

### 3.1.11 Infrastructure and Deployment

The entire application is containerized using **Docker** for easy deployment and reproducibility.

**Docker Setup:**

```
┌────────────────────────────────────────────────────────────────┐
│                  DOCKER ARCHITECTURE                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  docker-compose.yml orchestrates 3 containers:                 │
│                                                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │   fyp-frontend   │  │   fyp-backend    │  │ fyp-postgres │   │
│  │                  │  │                  │  │              │   │
│  │  Node.js 20      │  │  Python 3.11     │  │ PostgreSQL   │   │
│  │  Next.js 14      │  │  FastAPI         │  │ 15-alpine    │   │
│  │  Port: 3000      │  │  Port: 8000      │  │ Port: 5432   │   │
│  │                  │  │                  │  │              │   │
│  │  Depends on:     │  │  Depends on:     │  │ Volume:      │   │
│  │  - postgres      │  │  - postgres      │  │ postgres_data│   │
│  │  - backend       │  │                  │  │              │   │
│  └─────────────────┘  └─────────────────┘  └──────────────┘   │
│                                                                │
│  All containers connected via: fyp-network (bridge)            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Frontend Dockerfile (Node.js):**
- Uses multi-stage build (deps → builder → runner) to minimize image size
- Installs dependencies with `npm ci --legacy-peer-deps`
- Generates Prisma client and builds Next.js in standalone mode
- Runs database migrations automatically on startup before starting the server

**Backend Dockerfile (Python):**
- Based on `python:3.11-slim`
- Installs system dependencies (OpenCV, MediaPipe requirements)
- Installs Python packages from `requirements.txt` and TensorFlow separately
- Includes a health check endpoint using `curl`

**PostgreSQL:**
- Uses `postgres:15-alpine` (lightweight image)
- Data is persisted using a Docker volume (`postgres_data`)
- Health checks run every 10 seconds to ensure readiness

**Container Communication:**
All three containers are on the same Docker network (`fyp-network`). The frontend connects to the backend using `http://backend:8000` (Docker's internal DNS), and both the frontend and backend connect to the database using `postgres:5432` (the container name, not localhost).

**Environment Variables:**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Base URL for NextAuth (http://localhost:3000) |
| `NEXTAUTH_SECRET` | Secret key for JWT token signing |
| `JWT_SECRET` | Secret key for custom JWT operations |
| `UNIFIED_API_URL` | URL of the Python backend (http://backend:8000) |
| `EMAIL_USER` | Gmail address for sending verification emails |
| `EMAIL_PASS` | Gmail app password |

---

### 3.1.12 Error Handling and Reliability

The system includes multiple layers of error handling to ensure reliability:

**Frontend Error Handling:**
- File type validation (only video files accepted)
- File size warnings (>500MB)
- Authentication checks before allowing uploads
- Graceful error messages displayed to users
- Loading states and progress indicators

**Backend Error Handling:**
- Input validation (file type, model availability)
- Temporary file cleanup (even on errors)
- Detailed logging with timestamps and emoji indicators for easy debugging
- HTTP exception handling with proper status codes (400, 401, 403, 404, 500, 503)

**Timeout Handling:**
For long videos, the processing can exceed default HTTP timeout limits. Our system handles this with:
1. Backend keep-alive timeout of 3000 seconds
2. Frontend AbortController with 2-hour timeout
3. **Database recovery mechanism:** If the frontend connection times out but the backend completes processing, the system checks the database for the completed analysis and returns it to the user

**Database Error Handling:**
- Connection error detection (P1001)
- Authentication error detection (P1000)
- Unique constraint violation handling (duplicate emails)
- Graceful fallback when database save fails (analysis results are still returned to user)

---

## 3.2 External Libraries, APIs, and SDKs

The following external tools and libraries are used in the project:

### Frontend Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.x | React framework with server-side rendering and API routes |
| React | 18.x | UI component library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 3.4.x | Utility-first CSS framework for styling |
| Shadcn/ui | Latest | Pre-built UI components (Accordion, Cards, Dialog, etc.) |
| Radix UI | Latest | Accessible UI primitives (base for Shadcn/ui) |
| NextAuth.js | 4.24.x | Authentication library with JWT sessions |
| Prisma | 6.19.x | Database ORM for PostgreSQL |
| Recharts | Latest | Chart library for data visualization (Bar, Radar, Line charts) |
| Framer Motion | Latest | Animation library for smooth transitions |
| jsPDF | 4.1.x | PDF generation for downloadable reports |
| bcryptjs | Latest | Password hashing |
| Nodemailer | Latest | Email sending for verification codes |
| Zod | 3.24.x | Schema validation |
| Lucide React | 0.454.x | Icon library |
| Axios | 1.12.x | HTTP client (for some API calls) |

### Backend Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.104.1 | Python web framework for building the API |
| Uvicorn | 0.24.0 | ASGI server to run FastAPI |
| OpenCV | 4.8.1 | Video processing (reading frames, color conversion) |
| MediaPipe | 0.10.7 | Google's ML library for body and hand landmark detection |
| TensorFlow/Keras | 2.15.0 | Deep learning framework for running the BiLSTM model |
| NumPy | 1.24.3 | Numerical computing (array operations, matrix math) |
| Pandas | 2.1.3 | Data manipulation (used in model pipeline) |
| scikit-learn | 1.3.2 | Machine learning utilities (used in smile model) |
| joblib | 1.3.2 | Model serialization (loading .joblib model files) |
| python-multipart | 0.0.6 | Handling file uploads in FastAPI |

### Infrastructure

| Tool | Version | Purpose |
|------|---------|---------|
| PostgreSQL | 15 | Relational database for storing users and analyses |
| Docker | Latest | Containerization of all services |
| Docker Compose | Latest | Multi-container orchestration |
| Node.js | 20 (Docker) | JavaScript runtime for frontend |
| Python | 3.11 (Docker) | Python runtime for backend |

---

## 3.3 Code Repository

The project source code is hosted on **GitHub**:

- **Repository:** [github.com/Hassan0914/FINAL_YEAR_PROJECT](https://github.com/Hassan0914/FINAL_YEAR_PROJECT)
- **Branch:** `hassan-improve` (main development branch)

**Repository Structure:**

```
FINAL_YEAR_PROJECT/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (server-side)
│   │   ├── analyze-video/        # Video analysis endpoint
│   │   ├── analysis-history/     # History CRUD endpoint
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── generate-pdf/         # PDF report generation
│   │   └── ...
│   ├── dashboard/                # Dashboard page
│   ├── upload/                   # Video upload page
│   ├── history/                  # Analysis history page
│   └── auth/                     # Login, Signup, Verify pages
├── components/                   # Reusable React components
│   ├── ui/                       # Shadcn/ui components
│   ├── performance-chart.tsx     # Score trend chart
│   ├── radar-chart.tsx           # Radar chart component
│   ├── score-gauge.tsx           # Circular score gauge
│   └── ...
├── lib/                          # Shared utilities
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Prisma database client
│   ├── email.ts                  # Email sending utility
│   └── jwt.ts                    # JWT token utilities
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Database model definitions
│   └── migrations/               # SQL migration files
├── Models/                       # AI/ML models
│   ├── gesture analysis model/   # BiLSTM gesture model files
│   │   ├── predict_gesture.py    # Gesture prediction inference
│   │   ├── process_video.py      # Video processing and scoring
│   │   └── bilstm_model/        # Model weights and config
│   └── smile model/              # Smile detection model files
├── docker/                       # Docker configuration
│   ├── Dockerfile.frontend       # Frontend container build
│   ├── Dockerfile.backend        # Backend container build
│   ├── docker-compose.yml        # Multi-container orchestration
│   └── docker-start.bat          # One-click Docker startup
├── unified_models_api.py         # Main Python backend API
├── middleware.ts                  # Next.js route protection
├── next.config.mjs               # Next.js configuration
├── package.json                  # Frontend dependencies
├── requirements.txt              # Backend Python dependencies
└── tailwind.config.ts            # Tailwind CSS configuration
```

---

## 3.4 Summary

In this chapter, we explained the full implementation of our AI-powered Interview Body Language Analysis System. The system is built as a three-tier application:

1. **Frontend (Next.js):** A modern web application that provides the user interface for uploading videos, viewing analysis results on an interactive dashboard with charts and feedback, and tracking improvement over time through analysis history.

2. **Backend (FastAPI):** A Python API server that receives uploaded videos, processes them using MediaPipe for body landmark extraction, and runs a trained BiLSTM deep learning model to classify gestures and calculate scores using a research-based weighted fusion formula.

3. **Database (PostgreSQL):** A relational database that stores user accounts (with hashed passwords and email verification), and all analysis results including individual gesture scores, facial scores, and processing metadata.

The system is fully containerized using Docker and Docker Compose, which means the entire application (frontend, backend, and database) can be started with a single command. This makes deployment and setup straightforward, whether on a local machine or a cloud server.

Key technical achievements include:
- Real-time body landmark extraction from video using MediaPipe (174 features per frame)
- BiLSTM-based gesture classification with softmax probability scoring
- Research-based weighted fusion for calculating an overall body language score
- Secure user authentication with JWT sessions, bcrypt password hashing, and email verification
- Responsive, animated dashboard with multiple chart types for data visualization
- Robust error handling including a database recovery mechanism for timeout scenarios
- One-click Docker deployment with automatic database migrations

The system demonstrates how modern web technologies (Next.js, React, Tailwind CSS) can be effectively combined with machine learning tools (TensorFlow, MediaPipe, OpenCV) to create a practical, user-friendly application for interview preparation and body language improvement.








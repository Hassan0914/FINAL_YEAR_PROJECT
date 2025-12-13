@echo off
REM Standalone test script for Smile/Facial Analysis Model
REM Usage: test_standalone.bat <video_path>

echo ========================================
echo Smile Analysis Model - Standalone Test
echo ========================================
echo.

if "%1"=="" (
    echo ERROR: Please provide a video file path
    echo.
    echo Usage: test_standalone.bat ^<video_path^>
    echo Example: test_standalone.bat "C:\Videos\interview.mp4"
    echo Example: test_standalone.bat uploads\test.avi
    exit /b 1
)

if not exist "%1" (
    echo ERROR: Video file not found: %1
    exit /b 1
)

echo Video file: %1
echo.

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo WARNING: Virtual environment not found. Using system Python.
    echo Make sure all dependencies are installed.
    echo.
)

echo Running smile analysis...
echo.
python video_smile_pipeline.py "%1"

echo.
echo ========================================
echo Test completed!
echo ========================================


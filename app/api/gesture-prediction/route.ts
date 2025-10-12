import { NextRequest, NextResponse } from 'next/server'

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'File must be a video' },
        { status: 400 }
      )
    }

    // Create FormData for Flask API
    const flaskFormData = new FormData()
    flaskFormData.append('video', file)

    // Call Flask API
    console.log(`Calling Flask API: ${FLASK_API_URL}/analyze_gesture`)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200000) // 20 minute timeout for MediaPipe processing
    
    const response = await fetch(`${FLASK_API_URL}/analyze_gesture`, {
      method: 'POST',
      body: flaskFormData,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    console.log(`Flask API response status: ${response.status}`)

    if (!response.ok) {
      let errorMessage = 'Failed to process video'
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorMessage
      } catch (e) {
        // If response is not JSON, get text
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    // Log the results to console for debugging
    console.log('=== GESTURE ANALYSIS RESULTS ===')
    console.log('Status:', result.status)
    console.log('Video Name:', result.video_name)
    console.log('Scores:', result.scores)
    console.log('Rates:', result.rates)
    console.log('Message:', result.message)
    console.log('===================================')
    
    // Transform Flask API response to match expected frontend format
    const transformedResult = {
      gesture_scores: {
        hidden_hands: result.scores.hidden_hands_score,
        hands_on_table: result.scores.hands_on_table_score,
        gestures_on_table: result.scores.gestures_on_table_score,
        other_gestures: result.scores.other_gestures_score,
        self_touch: result.scores.self_touch_score
      },
      frame_count: 0, // Flask API doesn't provide frame count
      landmarks_sample: [], // Flask API doesn't provide landmarks sample
      landmarks_summary: {
        total_frames: 0,
        left_hand_detected_frames: 0,
        right_hand_detected_frames: 0,
        both_hands_detected_frames: 0
      },
      voice_confidence: undefined, // Flask API doesn't provide voice analysis
      rates: result.rates,
      message: result.message
    }
    
    return NextResponse.json({
      success: true,
      data: transformedResult
    })

  } catch (error) {
    console.error('Error in gesture prediction API:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - analysis took too long' },
          { status: 408 }
        )
      }
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          { error: 'Flask API server is not running. Please start the Flask API server.' },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Health check - call Flask API health endpoint
    const response = await fetch(`${FLASK_API_URL}/health`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Flask API is not available' },
        { status: 503 }
      )
    }

    const healthData = await response.json()
    
    return NextResponse.json({
      success: true,
      data: healthData
    })

  } catch (error) {
    console.error('Error checking Flask API health:', error)
    return NextResponse.json(
      { error: 'Flask API is not available' },
      { status: 503 }
    )
  }
}



import { NextRequest, NextResponse } from 'next/server'

const UNIFIED_API_URL = process.env.UNIFIED_API_URL || 'http://localhost:8000'

// Set maximum duration for this route (in seconds)
// 3600 seconds = 1 hour (Next.js max is 300s for Hobby plan, but we'll set it high for self-hosted)
export const maxDuration = 3600 // 1 hour
export const dynamic = 'force-dynamic'

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

    // Create FormData for Unified API
    const unifiedFormData = new FormData()
    unifiedFormData.append('file', file)

    // Call Unified API - No timeout, let it run as long as needed
    console.log(`Calling Unified API: ${UNIFIED_API_URL}/api/analyze-all`)
    console.log('No timeout set - analysis can take as long as needed')
    
    const response = await fetch(`${UNIFIED_API_URL}/api/analyze-all`, {
      method: 'POST',
      body: unifiedFormData,
      // Removed signal/AbortController to allow unlimited time
    })
    
    console.log(`Unified API response status: ${response.status}`)

    if (!response.ok) {
      let errorMessage = 'Failed to process video'
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.error || errorMessage
      } catch (e) {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    console.log('=== UNIFIED ANALYSIS RESULTS ===')
    console.log('Gesture Analysis:', result.gesture_analysis)
    console.log('Smile Analysis:', result.smile_analysis)
    console.log('===================================')
    
    // Transform Unified API response to match frontend format
    const transformedResult = {
      video_name: result.video_name || file.name,
      gesture_analysis: result.gesture_analysis?.success ? {
        success: true,
        gesture_scores: result.gesture_analysis.scores || {},
        gesture_rates: {}, // Unified API doesn't provide rates, but we can calculate if needed
        frame_count: result.gesture_analysis.frames_processed || 0,
        message: 'Gesture analysis completed successfully'
      } : null,
      facial_analysis: result.smile_analysis?.success ? {
        success: true,
        smile_score: result.smile_analysis.smile_score || 0,
        processing_time: result.total_processing_time_seconds || 0,
        video_name: result.smile_analysis.video_name || file.name,
        interpretation: result.smile_analysis.interpretation || 'Unknown',
        frames_processed: result.smile_analysis.frames_processed || 0
      } : null
    }
    
    return NextResponse.json({
      success: true,
      data: transformedResult
    })

  } catch (error) {
    console.error('Error in unified video analysis API:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        return NextResponse.json(
          { error: 'Unified API server is not running. Please start the unified API server on port 8000.' },
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
    // Health check - call Unified API health endpoint
    const response = await fetch(`${UNIFIED_API_URL}/api/health`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unified API is not available' },
        { status: 503 }
      )
    }

    const healthData = await response.json()
    
    return NextResponse.json({
      success: true,
      data: healthData
    })

  } catch (error) {
    console.error('Error checking Unified API health:', error)
    return NextResponse.json(
      { error: 'Unified API is not available' },
      { status: 503 }
    )
  }
}


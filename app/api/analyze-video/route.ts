import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
      // Keep field names aligned for both dashboard and modal
      gesture_analysis: result.gesture_analysis?.success ? {
        success: true,
        // For dashboard
        gesture_scores: result.gesture_analysis.scores || {},
        gesture_rates: {}, // Unified API doesn't provide rates
        frame_count: result.gesture_analysis.frames_processed || 0,
        message: 'Gesture analysis completed successfully',
        // For modal backward-compat
        scores: result.gesture_analysis.scores || {},
        frames_processed: result.gesture_analysis.frames_processed || 0,
        total_predictions: result.gesture_analysis.total_predictions || 0,
      } : null,
      // Facial/smile analysis (alias both keys)
      facial_analysis: result.smile_analysis?.success ? {
        success: true,
        smile_score: result.smile_analysis.smile_score || 0,
        processing_time: result.total_processing_time_seconds || 0,
        video_name: result.smile_analysis.video_name || file.name,
        interpretation: result.smile_analysis.interpretation || 'Unknown',
        frames_processed: result.smile_analysis.frames_processed || 0,
        video_duration_seconds: result.smile_analysis.video_duration_seconds || 0,
      } : null,
      smile_analysis: result.smile_analysis?.success ? {
        success: true,
        smile_score: result.smile_analysis.smile_score || 0,
        interpretation: result.smile_analysis.interpretation || 'Unknown',
        frames_processed: result.smile_analysis.frames_processed || 0,
        video_duration_seconds: result.smile_analysis.video_duration_seconds || 0,
        processing_time_seconds: result.total_processing_time_seconds || 0,
      } : null,
      total_processing_time_seconds: result.total_processing_time_seconds || 0,
    }
    
    // Save analysis results to database if user is authenticated
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        const gestureScores = transformedResult.gesture_analysis?.gesture_scores || {}
        
        await prisma.analysisHistory.create({
          data: {
            userId: session.user.id,
            videoName: result.video_name || file.name,
            videoFileName: file.name,
            // Gesture Analysis Scores
            handsOnTable: gestureScores.hands_on_table || null,
            hiddenHands: gestureScores.hidden_hands || null,
            gestureOnTable: gestureScores.gestures_on_table || null,
            selfTouch: gestureScores.self_touch || null,
            otherGestures: gestureScores.other_gestures || null,
            // Facial Analysis Score
            smileScore: transformedResult.facial_analysis?.smile_score || null,
            // Processing Metadata
            gestureFrames: transformedResult.gesture_analysis?.frame_count || null,
            facialFrames: transformedResult.facial_analysis?.frames_processed || null,
            processingTime: result.total_processing_time_seconds || null,
            gestureSuccess: transformedResult.gesture_analysis?.success || false,
            facialSuccess: transformedResult.facial_analysis?.success || false,
          }
        })
        console.log('Analysis results saved to database for user:', session.user.id)
      } else {
        console.log('User not authenticated, skipping database save')
      }
    } catch (dbError) {
      console.error('Error saving analysis to database:', dbError)
      // Don't fail the request if database save fails
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


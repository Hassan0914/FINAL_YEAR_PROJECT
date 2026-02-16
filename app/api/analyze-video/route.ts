import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const UNIFIED_API_URL = process.env.UNIFIED_API_URL || 'http://localhost:8000'

// CRITICAL: Configuration for long video processing
// These settings are essential for videos longer than 5 minutes
export const maxDuration = 3600 // 1 hour - allows processing of long videos
export const dynamic = 'force-dynamic' // Disable caching

// Disable body size limit for this route (handled by Next.js config)
// This allows large video files to be uploaded
export const runtime = 'nodejs' // Use Node.js runtime for better performance

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('[Analyze Video] =========================================')
    console.log('[Analyze Video] New video analysis request received')
    console.log('[Analyze Video] Timestamp:', new Date().toISOString())
    
    // Validate authentication BEFORE starting video processing
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('[Analyze Video] ❌ Unauthorized: No valid session found')
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      )
    }
    console.log('[Analyze Video] ✅ Session validated for user:', session.user.id)

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('[Analyze Video] ❌ No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Log file details
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    console.log('[Analyze Video] 📁 File details:')
    console.log('[Analyze Video]    Name:', file.name)
    console.log('[Analyze Video]    Size:', fileSizeMB, 'MB')
    console.log('[Analyze Video]    Type:', file.type)

    // Validate file type
    if (!file.type.startsWith('video/')) {
      console.log('[Analyze Video] ❌ Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'File must be a video' },
        { status: 400 }
      )
    }

    // Warn for very large files
    if (file.size > 500 * 1024 * 1024) { // > 500MB
      console.log('[Analyze Video] ⚠️  Warning: Large file detected (>500MB). Processing may take longer.')
    }

    // Store filename for use in error handling
    const videoFileName = file.name
    const userId = session.user.id

    // Create FormData for Unified API
    const unifiedFormData = new FormData()
    unifiedFormData.append('file', file)

    // Call Unified API with detailed logging
    console.log('[Analyze Video] 🚀 Calling Unified API:', `${UNIFIED_API_URL}/api/analyze-all`)
    console.log('[Analyze Video] ⏱️  No timeout - allowing unlimited processing time for long videos')
    console.log('[Analyze Video] 📤 Sending request to Python backend...')
    
    const fetchStartTime = Date.now()
    
    // Use a custom fetch with extended timeout for long videos
    // Node.js fetch has a default headers timeout of ~6 minutes, which is too short
    // We'll use AbortController with a very long timeout, but the real issue is the headers timeout
    // For now, we'll let it timeout and handle it gracefully
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 7200000) // 2 hours
    
    let response: Response
    try {
      response = await fetch(`${UNIFIED_API_URL}/api/analyze-all`, {
        method: 'POST',
        body: unifiedFormData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError // Re-throw to be handled by outer catch
    }
    
    const fetchDuration = ((Date.now() - fetchStartTime) / 1000).toFixed(2)
    console.log('[Analyze Video] 📥 Received response from Unified API')
    console.log('[Analyze Video]    Status:', response.status)
    console.log('[Analyze Video]    Duration:', fetchDuration, 'seconds')

    if (!response.ok) {
      console.log('[Analyze Video] ❌ Unified API returned error status:', response.status)
      let errorMessage = 'Failed to process video'
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.error || errorMessage
        console.log('[Analyze Video] Error details:', errorData)
      } catch (e) {
        const errorText = await response.text()
        errorMessage = errorText || errorMessage
        console.log('[Analyze Video] Error text:', errorText)
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    console.log('[Analyze Video] ✅ Analysis completed successfully')
    console.log('[Analyze Video] 📊 Results summary:')
    console.log('[Analyze Video]    Gesture Analysis:', result.gesture_analysis?.success ? '✅ Success' : '❌ Failed')
    console.log('[Analyze Video]    Smile Analysis:', result.smile_analysis?.success ? '✅ Success' : '❌ Failed')
    console.log('[Analyze Video]    Processing Time:', result.total_processing_time_seconds, 'seconds')
    
    // DEBUG: Log the raw scores from backend
    console.log('[Analyze Video] 🔍 DEBUG - Raw gesture_analysis.scores from backend:')
    console.log('[Analyze Video]    ', JSON.stringify(result.gesture_analysis?.scores, null, 2))
    console.log('[Analyze Video] 🔍 DEBUG - Full gesture_analysis object:')
    console.log('[Analyze Video]    ', JSON.stringify(result.gesture_analysis, null, 2))
    
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
        overall_score: result.gesture_analysis.overall_score || null,
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
    
    // Save analysis results to database (session already validated at start)
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        const gestureScores = transformedResult.gesture_analysis?.gesture_scores || {}
        
        // DEBUG: Log what we're about to save
        console.log('[Analyze Video] 🔍 DEBUG - gestureScores extracted for database:')
        console.log('[Analyze Video]    ', JSON.stringify(gestureScores, null, 2))
        console.log('[Analyze Video] 🔍 DEBUG - Individual score values:')
        console.log('[Analyze Video]    hands_on_table:', gestureScores.hands_on_table)
        console.log('[Analyze Video]    hidden_hands:', gestureScores.hidden_hands)
        console.log('[Analyze Video]    gestures_on_table:', gestureScores.gestures_on_table)
        console.log('[Analyze Video]    self_touch:', gestureScores.self_touch)
        
        // Generate ID for analysis history record
        const analysisId = crypto.randomUUID()
        
        const dbData = {
          id: analysisId,
          userId: session.user.id,
          videoName: result.video_name || file.name,
          videoFileName: file.name,
          // Gesture Analysis Scores
          handsOnTable: gestureScores.hands_on_table !== undefined ? gestureScores.hands_on_table : null,
          hiddenHands: gestureScores.hidden_hands !== undefined ? gestureScores.hidden_hands : null,
          gestureOnTable: gestureScores.gestures_on_table !== undefined ? gestureScores.gestures_on_table : null,
          selfTouch: gestureScores.self_touch !== undefined ? gestureScores.self_touch : null,
          // Facial Analysis Score
          smileScore: transformedResult.facial_analysis?.smile_score || null,
          // Processing Metadata
          gestureFrames: transformedResult.gesture_analysis?.frame_count || null,
          facialFrames: transformedResult.facial_analysis?.frames_processed || null,
          processingTime: result.total_processing_time_seconds || null,
          gestureSuccess: transformedResult.gesture_analysis?.success || false,
          facialSuccess: transformedResult.facial_analysis?.success || false,
          finalScore: result.gesture_analysis?.overall_score || transformedResult.gesture_analysis?.overall_score || null,
        }
        
        // DEBUG: Log what we're saving to database
        console.log('[Analyze Video] 🔍 DEBUG - Data being saved to database:')
        console.log('[Analyze Video]    ', JSON.stringify(dbData, null, 2))
        
        await prisma.analysis_history.create({
          data: dbData
        })
        console.log('[Analyze Video] ✅ Analysis results saved to database for user:', session.user.id)
      }
    } catch (dbError) {
      console.error('[Analyze Video] ⚠️  Database save error:', dbError)
      // Don't fail the request if database save fails
    }
    
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('[Analyze Video] 🎉 Complete! Total request duration:', totalDuration, 'seconds')
    console.log('[Analyze Video] =========================================')
    
    return NextResponse.json({
      success: true,
      data: transformedResult
    })

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error('[Analyze Video] ❌ FATAL ERROR after', duration, 'seconds')
    console.error('[Analyze Video] Error details:', error)
    
    if (error instanceof Error) {
      console.error('[Analyze Video] Error message:', error.message)
      console.error('[Analyze Video] Error stack:', error.stack)
      
      // Check for headers timeout (UND_ERR_HEADERS_TIMEOUT) - backend may have completed
      if (error.message.includes('UND_ERR_HEADERS_TIMEOUT') || 
          (error as any).cause?.code === 'UND_ERR_HEADERS_TIMEOUT' ||
          error.message.includes('Headers Timeout')) {
        console.error('[Analyze Video] ❌ Headers timeout - checking database for completed analysis...')
        
        // Check if backend completed and saved results to database
        try {
          const session = await getServerSession(authOptions)
          if (session?.user?.id && videoFileName) {
            // Look for the most recent analysis for this user with this filename
            // Check within the last 30 minutes (backend should complete by then)
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
            
            const recentAnalysis = await prisma.analysis_history.findFirst({
              where: {
                userId: session.user.id,
                videoFileName: videoFileName,
                createdAt: {
                  gte: thirtyMinutesAgo
                },
                gestureSuccess: true, // Only return if gesture analysis succeeded
              },
              orderBy: {
                createdAt: 'desc'
              }
            })
              
              if (recentAnalysis) {
                console.log('[Analyze Video] ✅ Found completed analysis in database after timeout!')
                
                // Transform database record back to frontend format
                const transformedResult = {
                  video_name: recentAnalysis.videoName,
                  gesture_analysis: {
                    success: true,
                    gesture_scores: {
                      hands_on_table: recentAnalysis.handsOnTable,
                      hidden_hands: recentAnalysis.hiddenHands,
                      gestures_on_table: recentAnalysis.gestureOnTable,
                      self_touch: recentAnalysis.selfTouch,
                    },
                    gesture_rates: {},
                    frame_count: recentAnalysis.gestureFrames || 0,
                    overall_score: recentAnalysis.finalScore,
                    message: 'Gesture analysis completed successfully',
                    scores: {
                      hands_on_table: recentAnalysis.handsOnTable,
                      hidden_hands: recentAnalysis.hiddenHands,
                      gestures_on_table: recentAnalysis.gestureOnTable,
                      self_touch: recentAnalysis.selfTouch,
                    },
                    frames_processed: recentAnalysis.gestureFrames || 0,
                    total_predictions: 0,
                  },
                  facial_analysis: recentAnalysis.facialSuccess && recentAnalysis.smileScore !== null ? {
                    success: true,
                    smile_score: recentAnalysis.smileScore,
                    processing_time: recentAnalysis.processingTime || 0,
                    video_name: recentAnalysis.videoName,
                    interpretation: 'Unknown',
                    frames_processed: recentAnalysis.facialFrames || 0,
                    video_duration_seconds: 0,
                  } : null,
                  smile_analysis: recentAnalysis.facialSuccess && recentAnalysis.smileScore !== null ? {
                    success: true,
                    smile_score: recentAnalysis.smileScore,
                    interpretation: 'Unknown',
                    frames_processed: recentAnalysis.facialFrames || 0,
                    video_duration_seconds: 0,
                    processing_time_seconds: recentAnalysis.processingTime || 0,
                  } : null,
                  total_processing_time_seconds: recentAnalysis.processingTime || 0,
                }
                
                console.log('[Analyze Video] 🎉 Returning saved analysis results from database')
                return NextResponse.json({
                  success: true,
                  data: transformedResult,
                  recovered_from_timeout: true
                })
              } else {
                console.log('[Analyze Video] ⏳ No completed analysis found in database yet - still processing')
              }
          }
        } catch (dbCheckError) {
          console.error('[Analyze Video] ⚠️  Error checking database:', dbCheckError)
          // Fall through to return timeout error
        }
        
        // If no results found in database, return timeout message
        console.error('[Analyze Video] ❌ Headers timeout - backend may still be processing')
        return NextResponse.json(
          { 
            error: 'Video processing is taking longer than expected. The backend is still analyzing your video. Please check the backend console for progress. The analysis will complete in the background and results will be saved to your dashboard.',
            timeout: true,
            still_processing: true
          },
          { status: 504 }
        )
      }
      
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
        console.error('[Analyze Video] ❌ Python backend not reachable')
        return NextResponse.json(
          { error: 'Unified API server is not running. Please start the unified API server on port 8000.' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT') || error.message.includes('AbortError')) {
        console.error('[Analyze Video] ❌ Request timeout')
        return NextResponse.json(
          { 
            error: 'Video processing is taking longer than expected. The backend may still be processing. Please check the backend console.',
            timeout: true
          },
          { status: 504 }
        )
      }
    }
    
    console.log('[Analyze Video] =========================================')
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


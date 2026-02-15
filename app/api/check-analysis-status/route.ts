import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Check if analysis has completed for a given video filename
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { videoFileName } = body

    if (!videoFileName) {
      return NextResponse.json(
        { error: 'videoFileName is required' },
        { status: 400 }
      )
    }

    // Look for the most recent analysis for this user with this filename
    // Check within the last 1 hour (backend should complete by then)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentAnalysis = await prisma.analysis_history.findFirst({
      where: {
        userId: session.user.id,
        videoFileName: videoFileName,
        createdAt: {
          gte: oneHourAgo
        },
        gestureSuccess: true, // Only return if gesture analysis succeeded
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (recentAnalysis) {
      console.log('[Check Analysis Status] ✅ Found completed analysis for:', videoFileName)
      
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
      
      return NextResponse.json({
        success: true,
        completed: true,
        data: transformedResult,
        recovered_from_database: true
      })
    } else {
      console.log('[Check Analysis Status] ⏳ No completed analysis found yet for:', videoFileName)
      return NextResponse.json({
        success: true,
        completed: false,
        message: 'Analysis still processing or not found'
      })
    }
  } catch (error) {
    console.error('[Check Analysis Status] ❌ Error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}


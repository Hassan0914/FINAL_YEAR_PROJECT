import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Fetch analysis history with optional monthly aggregation
export async function GET(request: NextRequest) {
  try {
    console.log('[Analysis History] GET request received')
    
    // Get authenticated user
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('[Analysis History] Unauthorized - no session')
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please login to view analysis history' },
        { status: 401 }
      )
    }

    console.log('[Analysis History] User authenticated:', session.user.id)

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('mode') // 'list' or 'monthly'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Monthly aggregation mode
    if (mode === 'monthly') {
      console.log('[Analysis History] Fetching monthly aggregation')
      
      // Fetch all analyses for the user (for aggregation)
      const analyses = await prisma.analysis_history.findMany({
        where: {
          userId: session.user.id
        },
        select: {
          handsOnTable: true,
          hiddenHands: true,
          gestureOnTable: true,
          selfTouch: true,
          smileScore: true,
          finalScore: true,
          createdAt: true,
        }
      })

      // Group by month and calculate averages
      const monthlyData: { [key: string]: any } = {}
      
      analyses.forEach(analysis => {
        const monthKey = new Date(analysis.createdAt).toISOString().substring(0, 7) // YYYY-MM
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            count: 0,
            handsOnTableSum: 0,
            hiddenHandsSum: 0,
            gestureOnTableSum: 0,
            selfTouchSum: 0,
            smileScoreSum: 0,
            validScores: {
              handsOnTable: 0,
              hiddenHands: 0,
              gestureOnTable: 0,
              selfTouch: 0,
              smileScore: 0,
            }
          }
        }
        
        monthlyData[monthKey].count++
        
        if (analysis.handsOnTable !== null) {
          monthlyData[monthKey].handsOnTableSum += analysis.handsOnTable
          monthlyData[monthKey].validScores.handsOnTable++
        }
        if (analysis.hiddenHands !== null) {
          monthlyData[monthKey].hiddenHandsSum += analysis.hiddenHands
          monthlyData[monthKey].validScores.hiddenHands++
        }
        if (analysis.gestureOnTable !== null) {
          monthlyData[monthKey].gestureOnTableSum += analysis.gestureOnTable
          monthlyData[monthKey].validScores.gestureOnTable++
        }
        if (analysis.selfTouch !== null) {
          monthlyData[monthKey].selfTouchSum += analysis.selfTouch
          monthlyData[monthKey].validScores.selfTouch++
        }
        if (analysis.smileScore !== null) {
          monthlyData[monthKey].smileScoreSum += analysis.smileScore
          monthlyData[monthKey].validScores.smileScore++
        }
      })

      // Calculate averages
      const monthlyAggregates = Object.values(monthlyData).map((data: any) => ({
        month: data.month,
        totalAnalyses: data.count,
        averages: {
          handsOnTable: data.validScores.handsOnTable > 0 
            ? (data.handsOnTableSum / data.validScores.handsOnTable).toFixed(2) 
            : null,
          hiddenHands: data.validScores.hiddenHands > 0 
            ? (data.hiddenHandsSum / data.validScores.hiddenHands).toFixed(2) 
            : null,
          gestureOnTable: data.validScores.gestureOnTable > 0 
            ? (data.gestureOnTableSum / data.validScores.gestureOnTable).toFixed(2) 
            : null,
          selfTouch: data.validScores.selfTouch > 0 
            ? (data.selfTouchSum / data.validScores.selfTouch).toFixed(2) 
            : null,
          smileScore: data.validScores.smileScore > 0 
            ? (data.smileScoreSum / data.validScores.smileScore).toFixed(2) 
            : null,
        }
      })).sort((a, b) => a.month.localeCompare(b.month))

      console.log(`[Analysis History] Monthly aggregation complete: ${monthlyAggregates.length} months`)
      
      return NextResponse.json({
        success: true,
        data: {
          monthlyStats: monthlyAggregates
        }
      })
    }

    // Default list mode with pagination
    console.log(`[Analysis History] Fetching list page ${page}, limit ${limit}`)
    
    const [analyses, totalCount] = await Promise.all([
      prisma.analysis_history.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
        select: {
          id: true,
          videoName: true,
          videoFileName: true,
          handsOnTable: true,
          hiddenHands: true,
          gestureOnTable: true,
          selfTouch: true,
          // Facial Analysis Score
          smileScore: true,
          finalScore: true,
          gestureFrames: true,
          facialFrames: true,
          processingTime: true,
          gestureSuccess: true,
          facialSuccess: true,
          createdAt: true,
        }
      }),
      prisma.analysis_history.count({
        where: {
          userId: session.user.id
        }
      })
    ])

    console.log(`[Analysis History] Found ${totalCount} total records, returning ${analyses.length}`)

    return NextResponse.json({
      success: true,
      data: {
        analyses,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + limit < totalCount
        }
      }
    })

  } catch (error) {
    console.error('[Analysis History] Error fetching:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'database_error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete specific analysis record
export async function DELETE(request: NextRequest) {
  try {
    console.log('[Analysis History] DELETE request received')
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Missing analysis ID' },
        { status: 400 }
      )
    }

    console.log(`[Analysis History] Deleting analysis ${analysisId} for user ${session.user.id}`)

    // Verify ownership before deleting
    const analysis = await prisma.analysis_history.findUnique({
      where: { id: analysisId },
      select: { userId: true }
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    if (analysis.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own analyses' },
        { status: 403 }
      )
    }

    // Delete the record
    await prisma.analysis_history.delete({
      where: { id: analysisId }
    })

    console.log(`[Analysis History] Successfully deleted analysis ${analysisId}`)

    return NextResponse.json({
      success: true,
      message: 'Analysis deleted successfully'
    })

  } catch (error) {
    console.error('[Analysis History] Error deleting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Fetch user's analysis history
    const [analyses, totalCount] = await Promise.all([
      prisma.analysisHistory.findMany({
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
          // Gesture Analysis Scores
          handsOnTable: true,
          hiddenHands: true,
          gestureOnTable: true,
          selfTouch: true,
          otherGestures: true,
          // Facial Analysis Score
          smileScore: true,
          // Processing Metadata
          gestureFrames: true,
          facialFrames: true,
          processingTime: true,
          gestureSuccess: true,
          facialSuccess: true,
          createdAt: true,
        }
      }),
      prisma.analysisHistory.count({
        where: {
          userId: session.user.id
        }
      })
    ])

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
    console.error('Error fetching analysis history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


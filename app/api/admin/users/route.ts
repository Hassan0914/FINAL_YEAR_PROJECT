import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Admin endpoint to view all users with their analysis counts
 * Access at: http://localhost:3000/api/admin/users
 * 
 * Optional query params:
 * - ?userId=<id> - Get specific user with their analyses
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // If userId is provided, return that user with their analyses
    if (userId) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!user) {
        return NextResponse.json({ 
          error: "User not found" 
        }, { status: 404 })
      }

      const analyses = await prisma.analysis_history.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          videoName: true,
          videoFileName: true,
          handsOnTable: true,
          hiddenHands: true,
          gestureOnTable: true,
          selfTouch: true,
          smileScore: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({
        success: true,
        user: {
          ...user,
          analysisCount: analyses.length,
        },
        analyses,
      }, { status: 200 })
    }

    // Otherwise, return all users with analysis counts
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        verificationCode: true,
        codeExpiresAt: true,
        // Don't include password for security
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get analysis count for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const analysisCount = await prisma.analysis_history.count({
          where: { userId: user.id },
        })
        return {
          ...user,
          analysisCount,
          hasVerificationCode: !!user.verificationCode,
          codeExpired: user.codeExpiresAt ? new Date() > user.codeExpiresAt : null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      count: usersWithCounts.length,
      users: usersWithCounts,
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


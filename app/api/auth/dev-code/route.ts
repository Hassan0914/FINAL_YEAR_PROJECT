import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Development-only endpoint to retrieve verification codes
// This is only available in development mode (when EMAIL_USER/EMAIL_PASS are not set)
export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return NextResponse.json({
      error: "This endpoint is only available in development mode",
      errorType: "not_available",
    }, { status: 403 })
  }

  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({
        error: "Email is required",
        errorType: "validation",
      }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const user = await prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: { verificationCode: true, isVerified: true },
    })

    if (!user) {
      return NextResponse.json({
        error: "User not found",
        errorType: "user_not_found",
      }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({
        error: "Email already verified",
        errorType: "already_verified",
      }, { status: 400 })
    }

    if (!user.verificationCode) {
      return NextResponse.json({
        error: "No verification code found",
        errorType: "no_code",
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      code: user.verificationCode,
      message: "Verification code retrieved (dev mode only)",
    })
  } catch (error) {
    console.error("Dev code error:", error)
    return NextResponse.json({
      error: "Internal server error",
      errorType: "server_error",
    }, { status: 500 })
  }
}


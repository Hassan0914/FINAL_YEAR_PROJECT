import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { signToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    // Validation
    if (!email || !code) {
      return NextResponse.json({ 
        error: "Email and verification code are required",
        errorType: "validation"
      }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (!user) {
      return NextResponse.json({ 
        error: "User not found",
        errorType: "user_not_found",
        message: "No account found with this email address."
      }, { status: 404 })
    }

    // Check if user is already verified
    if (user.isVerified) {
      return NextResponse.json({ 
        error: "Email already verified",
        errorType: "already_verified",
        message: "This email is already verified. You can log in now."
      }, { status: 400 })
    }

    // Check if verification code exists and is not expired
    if (!user.verificationCode || !user.codeExpiresAt) {
      return NextResponse.json({ 
        error: "No verification code found",
        errorType: "no_code",
        message: "No verification code found. Please request a new one."
      }, { status: 400 })
    }

    // Check if code is expired
    if (new Date() > user.codeExpiresAt) {
      return NextResponse.json({ 
        error: "Verification code expired",
        errorType: "code_expired",
        message: "Verification code has expired. Please request a new one."
      }, { status: 400 })
    }

    // Case 1: Correct code
    if (user.verificationCode === code) {
      // Update user account's verified field to true
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationCode: null, // Clear the code after successful verification
          codeExpiresAt: null,
        },
      })

      // Generate JWT token for immediate login
      const token = signToken({
        id: updatedUser.id,
        email: updatedUser.email,
      })

      return NextResponse.json(
        {
          success: true,
          message: "Email verified successfully! Redirecting to upload page...",
          errorType: "verification_success",
          token,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            isVerified: updatedUser.isVerified,
          },
        },
        { status: 200 }
      )
    } else {
      // Case 2: Incorrect code
      return NextResponse.json({ 
        error: "Incorrect verification code",
        errorType: "incorrect_code",
        message: "The verification code you entered is incorrect. Please try again."
      }, { status: 400 })
    }
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      errorType: "server_error",
      message: "Something went wrong. Please try again later."
    }, { status: 500 })
  }
}
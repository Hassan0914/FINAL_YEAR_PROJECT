import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({
        error: "Email is required",
        errorType: "validation",
      }, { status: 400 })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    const user = await prisma.users.findUnique({ where: { email: normalizedEmail } })
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
        message: "This email is already verified. You can log in directly.",
      }, { status: 400 })
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.users.update({
      where: { id: user.id },
      data: { verificationCode, codeExpiresAt },
    })

    const emailResult = await sendVerificationEmail(normalizedEmail, verificationCode)
    if (!emailResult.success && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return NextResponse.json({
        error: "Failed to resend verification email",
        errorType: "email_send_failed",
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent. Please check your email.",
      errorType: "resend_success",
    })
  } catch (error) {
    console.error("Resend code error:", error)
    return NextResponse.json({
      error: "Internal server error",
      errorType: "server_error",
    }, { status: 500 })
  }
}




































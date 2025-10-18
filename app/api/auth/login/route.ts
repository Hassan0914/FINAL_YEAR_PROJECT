import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { signToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Debugging: log incoming payload (avoid logging password in real logs)
    console.log('Login attempt for:', { email })

    // Validation
    if (!email || !password) {
      return NextResponse.json({ 
        error: "Email and password are required",
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

    // Case 1: Email not found in database
    if (!user) {
      return NextResponse.json({ 
        error: "Email not registered",
        errorType: "email_not_found",
        message: "This email is not registered. Please sign up first."
      }, { status: 404 })
    }

    // Case 2: Email exists but not verified
    if (!user.isVerified) {
      return NextResponse.json(
        { 
          error: "Email not verified",
          errorType: "email_not_verified",
          message: "Please verify your email before logging in.",
          canResendVerification: true
        },
        { status: 400 }
      )
    }

  // Case 3: Email verified, now check password
  // Debugging: ensure user object has expected fields
  console.log('Found user for login:', { id: user?.id, email: user?.email, hasPassword: Boolean(user?.password) })
  const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: "Wrong username or password",
        errorType: "invalid_credentials",
        message: "The email or password you entered is incorrect. Please try again."
      }, { status: 401 })
    }

    // Case 4: Email verified and password correct - SUCCESS
    const token = signToken({
      id: user.id,
      email: user.email,
    })

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      errorType: "server_error",
      message: "Something went wrong. Please try again later."
    }, { status: 500 })
  }
}



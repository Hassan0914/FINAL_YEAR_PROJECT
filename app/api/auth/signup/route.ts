import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let requestData
    try {
      requestData = await request.json()
    } catch (e) {
      console.error('[Signup] Failed to parse JSON:', e)
      return NextResponse.json({ 
        error: "Invalid request format",
        errorType: "invalid_request"
      }, { status: 400 })
    }

    const { email, password, name } = requestData
    console.log('[Signup] New signup attempt for email:', email)

    // Validation
    if (!email || !password) {
      return NextResponse.json({ 
        error: "Email and password are required",
        errorType: "validation"
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long",
        errorType: "validation"
      }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        errorType: "validation"
      }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Case 1: Check if email already exists
    console.log('[Signup] Checking if email exists in database...')
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (existingUser) {
      console.log('[Signup] Email already exists:', normalizedEmail)
      return NextResponse.json({ 
        error: "Email already exists",
        errorType: "email_exists",
        message: "An account with this email already exists. Please use a different email or try logging in."
      }, { status: 409 })
    }

    // Case 2: Email does not exist - proceed with signup
    console.log('[Signup] Email is unique, proceeding with user creation...')
    
    // Generate random six-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Hash password securely
    console.log('[Signup] Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)

    // Store user in database with verified = false
    console.log('[Signup] Creating user in database...')
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name ? name.trim() : null,
        isVerified: false,
        verificationCode,
        codeExpiresAt,
      },
    })
    console.log('[Signup] User created successfully, ID:', user.id)

    // Send verification email
    console.log('[Signup] Sending verification email...')
    const emailResult = await sendVerificationEmail(normalizedEmail, verificationCode)

    // Check if we're in development mode (no email credentials)
    const isDevelopment = !process.env.EMAIL_USER || !process.env.EMAIL_PASS
    
    console.log('[Signup] Signup completed successfully. Development mode:', isDevelopment)

    return NextResponse.json(
      {
        success: true,
        message: isDevelopment 
          ? `Account created! Check your email. If dev mode, use the code shown in the server logs.`
          : "Account created! Please check your email for the 6-digit verification code.",
        errorType: "signup_success",
        userId: user.id,
        requiresVerification: true
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[Signup] Critical error:", error)
    console.error("[Signup] Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: "Email already exists",
        errorType: "email_exists",
        message: "An account with this email already exists. Please use a different email or try logging in."
      }, { status: 409 })
    }
    
    // Check for database connection errors
    if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('connect'))) {
      return NextResponse.json({ 
        error: "Database connection failed",
        errorType: "db_error",
        message: "Unable to connect to the database. Please check your database connection."
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      errorType: "server_error",
      message: "Something went wrong. Please try again later."
    }, { status: 500 })
  }
}

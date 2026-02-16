import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

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
    const existingUser = await prisma.users.findUnique({
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

    // Generate user ID
    const userId = crypto.randomUUID()

    // Store user in database with verified = false (requires email verification)
    console.log('[Signup] Creating user in database...')
    const user = await prisma.users.create({
      data: {
        id: userId,
        email: normalizedEmail,
        password: hashedPassword,
        name: name ? name.trim() : null,
        isVerified: false, // User must verify email
        verificationCode,
        codeExpiresAt,
        updatedAt: new Date(),
      },
    })
    console.log('[Signup] User created successfully, ID:', user.id)

    // Send verification email
    console.log('[Signup] Sending verification email...')
    const { sendVerificationEmail } = await import('@/lib/email')
    const emailResult = await sendVerificationEmail(normalizedEmail, verificationCode)

    // Check if we're in development mode (no email credentials)
    const isDevelopment = !process.env.EMAIL_USER || !process.env.EMAIL_PASS
    
    console.log('[Signup] Signup completed successfully. Development mode:', isDevelopment)
    if (isDevelopment) {
      console.log('[Signup] 🔐 DEV MODE - Verification Code:', verificationCode)
    }

    return NextResponse.json(
      {
        success: true,
        message: isDevelopment 
          ? `Account created! Verification code: ${verificationCode} (Dev mode - check console)`
          : "Account created! Please check your email for the 6-digit verification code.",
        errorType: "signup_success",
        userId: user.id,
        requiresVerification: true,
        devCode: isDevelopment ? verificationCode : undefined, // Only send in dev mode
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    console.error("Error details:", error instanceof Error ? error.stack : error)
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ 
        error: "Email already exists",
        errorType: "email_exists",
        message: "An account with this email already exists. Please use a different email or try logging in."
      }, { status: 409 })
    }
    
    // Handle Prisma authentication errors (P1000)
    if (error instanceof Error && (error.message.includes('P1000') || error.message.includes('Authentication failed'))) {
      return NextResponse.json({ 
        error: "Database authentication failed",
        errorType: "database_error",
        message: "Database credentials are invalid. Please check your PostgreSQL username and password."
      }, { status: 503 })
    }
    
    // Handle Prisma connection errors (P1001)
    if (error instanceof Error && (error.message.includes('P1001') || error.message.includes('connect') || error.message.includes('ECONNREFUSED'))) {
      return NextResponse.json({ 
        error: "Database connection error",
        errorType: "database_error",
        message: "Unable to connect to database. Please ensure PostgreSQL is running and DATABASE_URL is correct."
      }, { status: 503 })
    }
    
    // Handle Prisma query errors
    if (error instanceof Error && error.message.includes('P2002')) {
      return NextResponse.json({ 
        error: "Email already exists",
        errorType: "email_exists",
        message: "An account with this email already exists. Please use a different email or try logging in."
      }, { status: 409 })
    }
    
    // Handle JSON parsing errors
    if (error instanceof Error && (error.message.includes('JSON') || error.message.includes('Unexpected token'))) {
      return NextResponse.json({ 
        error: "Invalid request format",
        errorType: "validation",
        message: "Invalid request data. Please check your input."
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      errorType: "server_error",
      message: error instanceof Error ? error.message : "Something went wrong. Please try again later."
    }, { status: 500 })
  }
}

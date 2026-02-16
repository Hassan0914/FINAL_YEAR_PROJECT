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
    const user = await prisma.users.findUnique({
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

    // Case 2: Check password (email verification check removed)
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

    // Case 3: Password correct - SUCCESS (no email verification required)
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
    console.error("Error details:", error instanceof Error ? error.stack : error)
    
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
        error: "Database constraint error",
        errorType: "database_error",
        message: "A database constraint was violated. Please try again."
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



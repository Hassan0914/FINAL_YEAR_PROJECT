import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        jwtToken: { label: "JWT Token", type: "text" },
      },
      async authorize(credentials) {
        // Allow either password OR jwtToken for authentication
        if (!credentials?.email || (!credentials?.password && !credentials?.jwtToken)) {
          throw new Error("Email and password (or token) required")
        }

        try {
          const normalizedEmail = credentials.email.toLowerCase().trim()
          console.log("Attempting login for email:", normalizedEmail)
          
          const user = await prisma.users.findUnique({
            where: {
              email: normalizedEmail,
            },
          })

          if (!user) {
            console.log("User not found for email:", normalizedEmail)
            throw new Error("Email not registered")
          }

          // If JWT token is provided (for post-verification auto-login), verify it
          if (credentials.jwtToken) {
            const { verifyToken } = await import("./jwt")
            const decoded = verifyToken(credentials.jwtToken)
            
            if (!decoded || decoded.id !== user.id || decoded.email !== user.email) {
              console.log("JWT token validation failed")
              throw new Error("Invalid token")
            }
            
            console.log("JWT token validated, login successful for user:", user.email)
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          }

          // Otherwise, validate password
          console.log("User found, checking password...")
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            console.log("Password validation failed")
            throw new Error("Invalid password")
          }

          // No email verification check - users are auto-verified on signup
          console.log("Login successful for user:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error // Re-throw the original error instead of generic message
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        console.log("[NextAuth] JWT token created for user:", user.email)
      }
      // Log token refresh for debugging
      if (trigger === "update") {
        console.log("[NextAuth] JWT token refreshed for user:", token.email)
      }
      return token
    },
    async session({ session, token, trigger }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      // Log session updates for debugging
      if (trigger === "update") {
        console.log("[NextAuth] Session updated for user:", session.user.email)
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production",
}

"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

export function useAuth() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [localUser, setLocalUser] = useState(null)

  // Check for localStorage token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      const user = localStorage.getItem('user')
      if (token && user) {
        setLocalUser(JSON.parse(user))
      }

      // React to changes from other tabs or after verification
      const onStorage = (e: StorageEvent) => {
        if (e.key === 'auth-token' || e.key === 'user') {
          const nextToken = localStorage.getItem('auth-token')
          const nextUser = localStorage.getItem('user')
          if (nextToken && nextUser) {
            setLocalUser(JSON.parse(nextUser))
          } else {
            setLocalUser(null)
          }
        }
      }
      window.addEventListener('storage', onStorage)
      return () => window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Debug logging
  // console.log("useAuth - session:", session)
  // console.log("useAuth - status:", status)
  // console.log("useAuth - localUser:", localUser)
  // console.log("useAuth - isAuthenticated:", !!(session || localUser))

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Login failed",
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      // Do not auto-login. Require email verification first.
      if (typeof window !== 'undefined') {
        localStorage.setItem('signupEmail', email)
      }

      return { success: true, requiresVerification: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Signup failed",
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user')
    }
    setLocalUser(null)
    await signOut({ redirect: false })
  }

  return {
    user: session?.user || localUser,
    isAuthenticated: !!(session || localUser),
    isLoggedIn: !!(session || localUser), // Add this alias for compatibility
    isLoading: status === "loading" || isLoading,
    login,
    signup,
    logout,
  }
}

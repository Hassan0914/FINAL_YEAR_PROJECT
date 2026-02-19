"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft, RefreshCw } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [errorType, setErrorType] = useState("")
  const [email, setEmail] = useState("")
  const [devCode, setDevCode] = useState<string | null>(null)

  useEffect(() => {
    // Get email from localStorage or URL params
    const storedEmail = localStorage.getItem('signupEmail')
    const urlEmail = searchParams.get('email')
    const emailValue = storedEmail || urlEmail || ""
    setEmail(emailValue)

    // Always try to fetch the code automatically (will work in dev mode)
    if (emailValue) {
      fetchDevCode(emailValue)
    }
  }, [searchParams])

  const fetchDevCode = async (emailToFetch: string) => {
    try {
      const response = await fetch('/api/auth/dev-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToFetch }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setDevCode(data.code)
        setCode(data.code) // Auto-fill the code
      }
    } catch (error) {
      // Silently fail - this is just a dev convenience feature
      console.log('Could not fetch dev code:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setErrorType("")

    if (!code || code.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit verification code")
      setErrorType("validation")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Case 1: Correct code - store token and create NextAuth session
        localStorage.setItem('auth-token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.removeItem('signupEmail') // Clean up
        localStorage.removeItem('devVerificationCode') // Clean up dev code
        
        setErrorMessage(data.message)
        setErrorType("verification_success")
        
        // Create NextAuth session using JWT token (no password needed)
        const { signIn } = await import('next-auth/react')
        
        try {
          // Sign in with NextAuth using JWT token instead of password
          const signInResult = await signIn('credentials', {
            email: data.user.email,
            jwtToken: data.token, // Use JWT token instead of password
            redirect: false,
          })
          
          if (signInResult?.error) {
            console.error('NextAuth signIn error:', signInResult.error)
            // Still redirect, but user might need to log in manually
            setTimeout(() => {
              window.location.href = '/auth/login?verified=true'
            }, 1500)
          } else {
            // Success! Redirect to dashboard
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 1000)
          }
        } catch (error) {
          console.error('Error creating session:', error)
          // Fallback: redirect to login with verified flag
          setTimeout(() => {
            window.location.href = '/auth/login?verified=true'
          }, 1500)
        }
      } else {
        // Case 2: Incorrect code or other errors
        setErrorMessage(data.message || data.error)
        setErrorType(data.errorType)
      }
    } catch (error: any) {
      setErrorMessage("Network error. Please check your connection and try again.")
      setErrorType("network_error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setErrorMessage("")
    setErrorType("")

    try {
      const response = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (response.ok) {
        setErrorMessage(data.message || 'Verification code sent. Please check your email.')
        setErrorType('info')
        // Fetch the new code in development mode
        await fetchDevCode(email)
      } else {
        // Check if error is "already verified"
        if (data.errorType === 'already_verified') {
          setErrorMessage("Your email is already verified! Redirecting to login...")
          setErrorType("info")
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
        } else {
          setErrorMessage(data.message || data.error || 'Failed to resend code. Please try again.')
          setErrorType(data.errorType || 'error')
        }
      }
    } catch (error) {
      setErrorMessage("Failed to resend code. Please try again.")
      setErrorType("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only digits, max 6
    setCode(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-gray-400">We've sent a 6-digit verification code to</CardDescription>
            <div className="text-blue-400 font-medium">{email}</div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Development Mode - Show Code */}
            {devCode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-yellow-300 font-semibold text-sm">Development Mode</p>
                </div>
                <p className="text-yellow-200 text-sm mb-2">Your verification code (auto-filled):</p>
                <div className="bg-gray-800/50 border border-yellow-500/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-300 tracking-widest">{devCode}</p>
                </div>
                <p className="text-yellow-200/70 text-xs mt-2">Code is already filled in the input below. Click "Verify Email" to continue.</p>
              </motion.div>
            )}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border text-sm ${
                  errorType === 'verification_success' 
                    ? 'bg-green-900/20 border-green-500/30 text-green-300'
                    : errorType === 'incorrect_code'
                    ? 'bg-red-900/20 border-red-500/30 text-red-300'
                    : errorType === 'code_expired'
                    ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                    : errorType === 'validation'
                    ? 'bg-blue-900/20 border-blue-500/30 text-blue-300'
                    : 'bg-red-900/20 border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {errorType === 'verification_success' && (
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {errorType === 'incorrect_code' && (
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    {errorType === 'code_expired' && (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {devCode && (
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-sm text-blue-300 text-center">
                  <strong>Dev Mode:</strong> Your verification code is <span className="font-mono text-lg font-bold">{devCode}</span>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-300">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={handleCodeChange}
                  className="text-center text-2xl tracking-widest bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white py-3 hover:scale-105 transition-all duration-300 border border-gray-600"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <button
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Resend verification code
              </button>

              <div className="border-t border-gray-700 pt-4">
                <button
                  onClick={() => router.push('/')}
                  className="text-gray-400 hover:text-gray-300 transition-colors text-sm flex items-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to home
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
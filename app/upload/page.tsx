"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, ArrowLeft, CheckCircle, AlertCircle, FileVideo, X, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"
import { AuthModal } from "@/components/auth-modal"

export default function UploadPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "complete" | "error">("idle")
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn) {
      setShowAuthModal(true)
    }
  }, [isLoggedIn])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    console.log("File selected:", file.name, file.type, file.size)
    
    // Validate file type
    if (!file.type.startsWith("video/")) {
      console.log("Invalid file type:", file.type)
      setUploadStatus("error")
      return
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      console.log("File too large:", file.size)
      setUploadStatus("error")
      return
    }

    console.log("Setting uploaded file and preview")
    setUploadedFile(file)
    setVideoPreview(URL.createObjectURL(file))
    setUploadStatus("idle")
    setUploadProgress(0)
  }

  const startUpload = async () => {
    if (!uploadedFile) {
      console.log("No file selected for upload")
      return
    }

    console.log("Starting upload for file:", uploadedFile.name)
    setUploadStatus("uploading")
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(uploadInterval)
            setUploadStatus("idle") // Ready for analysis
            console.log("Upload simulation complete")
            return 100
          }
          return prev + Math.random() * 15
        })
      }, 200)

      // Wait for upload simulation to complete
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus("error")
      setUploadProgress(0)
    }
  }

  const startAnalysis = async () => {
    if (!uploadedFile) {
      console.log("No file selected for analysis")
      return
    }

    console.log("Starting analysis for file:", uploadedFile.name)
    setUploadStatus("processing")
    setUploadProgress(0)

    try {
      // Create FormData for API call
      const formData = new FormData()
      formData.append('file', uploadedFile)

      // Start progress simulation that will be updated by the real API response
      let progressInterval: NodeJS.Timeout | null = null
      const startProgressSimulation = () => {
        progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            // Don't go above 95% until API actually completes
            if (prev >= 95) {
              return 95
            }
            return prev + Math.random() * 3
          })
        }, 500)
      }

      startProgressSimulation()

      console.log("Calling unified video analysis API...")
      console.log("Video file size:", (uploadedFile.size / (1024 * 1024)).toFixed(2), "MB")
      
      // Call the unified video analysis API (gesture + smile)
      // Use AbortController with very long timeout for long videos (2 hours)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, 7200000) // 2 hours timeout for very long videos (6000+ frames)
      
      let response: Response
      try {
        response = await fetch('/api/analyze-video', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        // Clear progress interval on error
        if (progressInterval) {
          clearInterval(progressInterval)
        }
        
        // Check if it's an abort (timeout) or network error
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('Request timeout - video processing is taking longer than expected')
          throw new Error('Video processing is taking longer than expected. The backend may still be processing. Please check the backend console or try again later.')
        }
        
        // Check if it's a network error (connection lost but backend still processing)
        if (fetchError instanceof Error && (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('network'))) {
          console.error('Network error - backend may still be processing')
          throw new Error('Connection lost during processing. The backend may still be analyzing your video. Please check the backend console or wait a few minutes and refresh.')
        }
        
        // Re-throw other errors
        throw fetchError
      }

      // Clear the progress simulation
      if (progressInterval) {
        clearInterval(progressInterval)
      }

      // Try to parse response as JSON, but handle non-JSON errors
      let result: any
      try {
        const responseText = await response.text()
        console.log("API response status:", response.status)
        console.log("API response text (first 500 chars):", responseText.substring(0, 500))
        
        try {
          result = JSON.parse(responseText)
          console.log("API response (parsed):", result)
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", parseError)
          throw new Error(`Backend returned non-JSON response: ${responseText.substring(0, 200)}`)
        }
      } catch (parseError) {
        console.error("Error reading response:", parseError)
        throw new Error(`Failed to read response from server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
      }

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.error('Authentication expired during video processing')
          alert('Your session expired during video processing. Please sign in again.')
          router.push('/auth/login?callbackUrl=/upload')
          return
        }
        
        // Handle timeout errors (backend may still be processing)
        if (response.status === 504) {
          console.error('Video processing timeout')
          // Check if backend is still processing
          if (result.still_processing || result.timeout) {
            throw new Error('Video processing is taking longer than expected. The backend is still analyzing your video. Please check the backend console for progress. Results will be saved to your dashboard when complete.')
          } else {
            throw new Error('Video processing took too long. The backend may still be processing. Please check the backend console.')
          }
        }
        
        // Handle backend unavailable
        if (response.status === 503) {
          console.error('Backend service unavailable')
          const backendError = result.error || 'Analysis service is currently unavailable.'
          throw new Error(`${backendError} Please check if the Python backend (port 8000) is running.`)
        }
        
        // Get detailed error message from backend
        let errorMsg = 'Analysis failed. Please try again.'
        if (result.error) {
          errorMsg = result.error
          console.error('Backend error:', errorMsg)
        } else if (result.detail) {
          errorMsg = result.detail
          console.error('Backend detail:', errorMsg)
        } else {
          console.error('Unknown error. Response status:', response.status, 'Response:', result)
        }
        
        throw new Error(errorMsg)
      }

      // Set progress to 100% only after API completes successfully
      setUploadProgress(100)
      
      // Store the analysis result in localStorage for the dashboard
      if (result.data) {
        localStorage.setItem('videoAnalysisResult', JSON.stringify(result.data))
        if (result.recovered_from_timeout) {
          console.log("✅ Analysis results recovered from database after connection timeout")
        }
        console.log("Analysis complete, stored results:", result.data)
      } else {
        console.error("No data in API response:", result)
        throw new Error('No analysis data received')
      }
      
      console.log("Analysis complete, redirecting to dashboard")
      
      setUploadStatus("complete")

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        // Ensure session is still valid before redirect
        fetch('/api/auth/session')
          .then(res => res.json())
          .then(session => {
            if (session?.user) {
              console.log('Session validated, redirecting to dashboard')
              router.push("/dashboard")
            } else {
              console.error('Session lost, redirecting to login')
              router.push('/auth/login?callbackUrl=/dashboard')
            }
          })
          .catch(() => {
            console.error('Session check failed, redirecting to login')
            router.push('/auth/login?callbackUrl=/dashboard')
          })
      }, 2000)

    } catch (error) {
      console.error('Analysis error:', error)
      
      // Check if it's a timeout/abort error
      if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('longer than expected') || error.message.includes('Connection lost'))) {
        // For timeout errors, show a message that backend might still be processing
        setUploadStatus("processing") // Keep as processing, not error
        setUploadProgress(95) // Keep progress high
        setErrorMessage('⚠️ Processing is taking longer than expected. The backend may still be analyzing your video. Checking database for completed results...')
        
        console.log("⚠️ Frontend timeout, but backend may still be processing. Starting polling for completed results...")
        
        // Start polling the database for completed results
        if (uploadedFile) {
          let pollCount = 0
          const maxPolls = 60 // Poll for up to 5 minutes (60 * 5 seconds)
          
          const pollInterval = setInterval(async () => {
            pollCount++
            console.log(`[Polling] Check ${pollCount}/${maxPolls} for completed analysis: ${uploadedFile.name}`)
            
            try {
              const pollResponse = await fetch('/api/check-analysis-status', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  videoFileName: uploadedFile.name
                })
              })
              
              const pollResult = await pollResponse.json()
              
              if (pollResult.success && pollResult.completed && pollResult.data) {
                console.log("✅ Found completed analysis in database! Recovering results...")
                clearInterval(pollInterval)
                
                // Store the recovered results
                localStorage.setItem('videoAnalysisResult', JSON.stringify(pollResult.data))
                
                // Update UI
                setUploadProgress(100)
                setUploadStatus("complete")
                setErrorMessage(null)
                
                // Redirect to dashboard
                setTimeout(() => {
                  router.push("/dashboard")
                }, 2000)
              } else if (pollCount >= maxPolls) {
                // Stop polling after max attempts
                console.log("⏱️ Polling timeout - no results found after 5 minutes")
                clearInterval(pollInterval)
                setErrorMessage('⚠️ Processing is taking longer than expected. The backend may still be analyzing your video. Please check the backend console. If processing completes, you can check your dashboard for results.')
              }
            } catch (pollError) {
              console.error('[Polling] Error checking status:', pollError)
              // Continue polling on error
            }
          }, 5000) // Poll every 5 seconds
          
          // Clean up interval if component unmounts
          return () => clearInterval(pollInterval)
        }
      } else {
        // For other errors, show normal error handling
        setUploadStatus("error")
        setUploadProgress(0)
        
        // Show user-friendly error message
        const errorMsg = error instanceof Error ? error.message : 'Analysis failed. Please try again.'
        setErrorMessage(errorMsg)
        
        // Clear error after 10 seconds
        setTimeout(() => {
          setErrorMessage(null)
        }, 10000)
      }
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setVideoPreview(null)
    setUploadProgress(0)
    setUploadStatus("idle")
    setErrorMessage(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
  }

  const getStatusMessage = () => {
    // If there's a custom error message (e.g., timeout), show it
    if (errorMessage) {
      return errorMessage
    }
    
    switch (uploadStatus) {
      case "uploading":
        return "Uploading your video..."
      case "processing":
        return "AI is analyzing your interview gestures and facial expressions... This may take several minutes for long videos (6000+ frames). Please keep this page open."
      case "complete":
        return "Analysis complete! Redirecting to results..."
      case "error":
        return "Analysis failed. Please try again."
      default:
        return ""
    }
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return null
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex items-center justify-center p-6">
        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Authentication Required</CardTitle>
            <CardDescription className="text-gray-400">
              Please sign in to upload and analyze your interview videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800"
            >
              Sign In
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
              >
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/30 via-transparent to-gray-800/30 animate-gradient opacity-50"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-gray-700/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gray-600/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      {/* Navigation */}
      <nav className="p-6 border-b border-gray-800/50 backdrop-blur-sm relative z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 border border-gray-700/50 hover:border-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Upload Interview Video
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Upload Your Interview Video
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Upload a 30-60 second video of yourself answering an interview question to get AI-powered feedback
          </p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Video Upload
              </CardTitle>
              <CardDescription className="text-gray-400">
                Supported formats: MP4, MOV, AVI • Maximum size: 100MB • Duration: 30-60 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadedFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer ${
                    dragActive
                      ? "border-gray-400 bg-gray-800/50"
                      : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/30"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {dragActive ? "Drop your video here" : "Upload your interview video"}
                  </h3>
                  <p className="text-gray-400 mb-4">Drag and drop your video file here, or click to browse</p>
                  <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent">
                    Choose File
                  </Button>
                  <input id="file-input" type="file" accept="video/*" onChange={handleFileInput} className="hidden" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Preview */}
                  <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                    <FileVideo className="w-8 h-8 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-white font-medium">{uploadedFile.name}</div>
                      <div className="text-sm text-gray-400">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUpload}
                      className="text-gray-400 hover:text-white"
                      disabled={uploadStatus === "uploading" || uploadStatus === "processing"}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Video Preview */}
                  {videoPreview && (
                    <div className="relative">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full max-h-64 rounded-lg bg-black"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {(uploadStatus === "uploading" || uploadStatus === "processing") && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{getStatusMessage()}</span>
                        <span className="text-gray-400">{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Status Message */}
                  {(uploadStatus === "complete" || uploadStatus === "error" || errorMessage) && (
                    <div className={`flex items-center gap-2 p-4 rounded-lg ${
                      uploadStatus === "error" ? "bg-red-900/30 border border-red-800/50" : 
                      errorMessage ? "bg-yellow-900/30 border border-yellow-800/50" :
                      "bg-gray-800/30"
                    }`}>
                      {getStatusIcon()}
                      <span className={`text-sm ${
                        uploadStatus === "error" ? "text-red-300" : 
                        errorMessage ? "text-yellow-300" :
                        "text-white"
                      }`}>{getStatusMessage()}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {uploadStatus === "idle" && uploadProgress === 0 && (
                    <div className="flex gap-4">
                      <Button
                        onClick={startUpload}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700"
                      >
                        Upload Video
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetUpload}
                        className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  )}

                  {/* Analysis Button - Show after upload is complete */}
                  {uploadStatus === "idle" && uploadProgress === 100 && (
                    <div className="flex gap-4">
                      <Button
                        onClick={startAnalysis}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700"
                      >
                        Analyze Gestures & Facial Expressions
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetUpload}
                        className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Video Quality</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      Ensure good lighting on your face
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      Position camera at eye level
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      Use a stable surface or tripod
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Content Guidelines</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      Answer a common interview question
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      Speak clearly and at normal pace
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      Maintain eye contact with camera
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}

"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  Eye,
  Mic,
  Brain,
  Calendar,
  Users,
  Award,
  ArrowLeft,
  Download,
  Upload,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { PerformanceChart } from "@/components/performance-chart"
import { RadarChart } from "@/components/radar-chart"
import { ScoreGauge } from "@/components/score-gauge"
import { AuthModal } from "@/components/auth-modal"

export default function DashboardPage() {
  const router = useRouter()
  const { isLoggedIn, logout } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [gestureAnalysis, setGestureAnalysis] = useState(null)
  const [facialAnalysis, setFacialAnalysis] = useState(null)
  const [voiceAnalysis, setVoiceAnalysis] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/demo-dashboard")
    }
    
    // Check for analysis results in localStorage (new format)
    const storedResult = localStorage.getItem('videoAnalysisResult')
    if (storedResult) {
      const result = JSON.parse(storedResult)
      
      // Extract gesture analysis
      if (result.gesture_analysis) {
        setGestureAnalysis({
          gesture_scores: result.gesture_analysis.gesture_scores || {},
          gesture_rates: result.gesture_analysis.gesture_rates || {},
          frame_count: result.gesture_analysis.frame_count || 0,
          message: result.gesture_analysis.message || 'Analysis completed'
        })
      }
      
      // Extract facial analysis
      if (result.facial_analysis) {
        setFacialAnalysis(result.facial_analysis)
      }
      
      // Extract voice analysis if available
      if (result.voice_scores) {
        setVoiceAnalysis(result.voice_scores)
      }
    } else {
      // Fallback to old format for backward compatibility
      const oldResult = localStorage.getItem('gestureAnalysisResult')
      if (oldResult) {
        const result = JSON.parse(oldResult)
        setGestureAnalysis(result)
        
        if (result.voice_scores) {
          setVoiceAnalysis(result.voice_scores)
        }
      }
    }
  }, [isLoggedIn, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleUploadClick = () => {
    if (isLoggedIn) {
      router.push("/upload")
    } else {
      setShowAuthModal(true)
    }
  }

  const handleDownloadPDF = async () => {
    if (!gestureAnalysis) {
      alert('No analysis data available to download')
      return
    }

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gestureScores: gestureAnalysis.gesture_scores,
          frameCount: gestureAnalysis.frame_count,
          landmarksSummary: gestureAnalysis.landmarks_summary,
          voiceConfidence: voiceAnalysis?.confidence || gestureAnalysis.voice_confidence
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'gesture-analysis-report.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF. Please try again.')
    }
  }

  const recentInterviews = [
    { id: 1, date: "2024-01-15", company: "Your Latest Interview", score: 87, status: "Excellent", isNew: true },
    { id: 2, date: "2024-01-12", company: "Microsoft", score: 82, status: "Good", isNew: false },
    { id: 3, date: "2024-01-10", company: "Amazon", score: 91, status: "Outstanding", isNew: false },
    { id: 4, date: "2024-01-08", company: "Meta", score: 79, status: "Good", isNew: false },
  ]

  const skillsData = [
    { skill: "Communication", score: 91 },
    { skill: "Body Language", score: 88 },
    { skill: "Eye Contact", score: 82 },
    { skill: "Confidence", score: 89 },
    { skill: "Technical Knowledge", score: 85 },
    { skill: "Problem Solving", score: 90 },
  ]

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/30 via-transparent to-gray-800/30 animate-gradient opacity-50"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-gray-700/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gray-600/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      {/* Navigation */}
      <nav className="p-6 border-b border-gray-800/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 border border-gray-700/50 hover:border-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              InterviewAI Dashboard
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleUploadClick}
              className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 border border-gray-600 hover:scale-105 transition-all duration-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              variant="outline" 
              className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 border border-gray-700/50 hover:border-gray-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Your Performance Analytics
          </h1>
          <p className="text-gray-300 text-lg">Track your interview performance and identify areas for improvement</p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="cursor-pointer"
          >
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300 hover:bg-gray-800/50 hover:border-gray-600/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {gestureAnalysis ? 
                    Math.round(Object.values(gestureAnalysis.gesture_scores).reduce((sum, score) => sum + score, 0) / 5) + '/7' : 
                    '87%'
                  }
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {gestureAnalysis ? 'Latest analysis' : 'Latest interview'}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="cursor-pointer"
          >
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300 hover:bg-gray-800/50 hover:border-gray-600/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Hand Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {gestureAnalysis ? 
                    Math.max(1, 8 - gestureAnalysis.gesture_scores.hidden_hands) + '/7' : 
                    '82%'
                  }
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {gestureAnalysis ? 'Hands visible' : 'Strong performance'}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="cursor-pointer"
          >
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300 hover:bg-gray-800/50 hover:border-gray-600/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Gesture Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {gestureAnalysis ? 
                    Math.max(gestureAnalysis.gesture_scores.other_gestures, gestureAnalysis.gesture_scores.gestures_on_table) + '/7' : 
                    '91%'
                  }
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {gestureAnalysis ? 'Expressive gestures' : 'Excellent clarity'}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="cursor-pointer"
          >
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300 hover:bg-gray-800/50 hover:border-gray-600/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {gestureAnalysis ? gestureAnalysis.frame_count : '1'}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  {gestureAnalysis ? 'Frames processed' : 'Completed'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/30 transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance Trend
                </CardTitle>
                <CardDescription className="text-gray-400">Your interview scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/30 transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Skills Analysis
                </CardTitle>
                <CardDescription className="text-gray-400">Breakdown of your interview skills</CardDescription>
              </CardHeader>
              <CardContent>
                <RadarChart data={skillsData} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gesture Analysis Results */}
        {gestureAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Gesture Analysis Results</CardTitle>
                <CardDescription className="text-gray-400">
                  AI-powered analysis of your interview gestures and body language (1-7 scale)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.hidden_hands?.toFixed(2) || '0.00'}/7
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Hidden Hands</div>
                    <div className="text-xs text-gray-400">Hands not visible</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.hands_on_table?.toFixed(2) || '0.00'}/7
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Hands on Table</div>
                    <div className="text-xs text-gray-400">Resting on table</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.gestures_on_table?.toFixed(2) || '0.00'}/7
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Gestures on Table</div>
                    <div className="text-xs text-gray-400">Gesturing near table</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.other_gestures?.toFixed(2) || '0.00'}/7
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Other Gestures</div>
                    <div className="text-xs text-gray-400">Expressive gestures</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.self_touch?.toFixed(2) || '0.00'}/7
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Self Touch</div>
                    <div className="text-xs text-gray-400">Touching face/body</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Facial Expression Analysis Results */}
        {facialAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Facial Expression Analysis</CardTitle>
                <CardDescription className="text-gray-400">
                  AI-powered analysis of your facial expressions and engagement (1-7 scale)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {facialAnalysis.smile_score ? facialAnalysis.smile_score.toFixed(2) : '0.00'}/7
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Smile Score</div>
                    <div className="text-xs text-gray-400">Engagement level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {facialAnalysis.processing_time ? facialAnalysis.processing_time.toFixed(2) : 'N/A'}s
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Processing Time</div>
                    <div className="text-xs text-gray-400">Analysis duration</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Voice Analysis Results */}
        {voiceAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mb-8"
          >
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Voice Confidence Analysis</CardTitle>
                <CardDescription className="text-gray-400">
                  AI-powered analysis of your voice tone and confidence (1-7 scale)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {voiceAnalysis.engaging_tone}/7
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Engaging Tone</div>
                    <div className="text-xs text-gray-400">Voice engagement level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {Math.round(voiceAnalysis.confidence * 100)}%
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Confidence</div>
                    <div className="text-xs text-gray-400">Analysis confidence</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Score Gauges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Latest Interview Analysis</CardTitle>
              <CardDescription className="text-gray-400">
                Detailed breakdown of your most recent interview performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ScoreGauge title="Confidence Level" score={89} color="gray" />
                <ScoreGauge title="Communication" score={91} color="gray" />
                <ScoreGauge title="Technical Skills" score={85} color="gray" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Interviews */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Interviews
              </CardTitle>
              <CardDescription className="text-gray-400">Your latest interview sessions and scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentInterviews.map((interview, index) => (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center">
                        <span className="text-white font-bold">{interview.score}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium">{interview.company}</div>
                          {interview.isNew && (
                            <Badge className="bg-gray-700/50 text-gray-300 border-gray-600 text-xs">New</Badge>
                          )}
                        </div>
                        <div className="text-gray-400 text-sm">{interview.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-gray-700/50 text-gray-300 border-gray-600">
                        {interview.status}
                      </Badge>
                      {interview.isNew ? (
                        <Link href="/analysis">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-300 hover:text-white hover:bg-gray-700/50"
                          >
                            View Analysis
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-gray-400 cursor-default opacity-50">
                          Sample Data
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}

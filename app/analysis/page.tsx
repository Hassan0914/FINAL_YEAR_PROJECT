"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Brain, TrendingUp, Eye, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ScoreGauge } from "@/components/score-gauge"

interface GestureScores {
  hidden_hands: number
  hands_on_table: number
  gestures_on_table: number
  self_touch: number
}

interface AnalysisResult {
  success: boolean
  gesture_scores: GestureScores
  frame_count: number
  message: string
}

export default function AnalysisPage() {
  const router = useRouter()
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get analysis result from localStorage
    const storedResult = localStorage.getItem('gestureAnalysisResult')
    if (storedResult) {
      setAnalysisResult(JSON.parse(storedResult))
    }
    setLoading(false)
  }, [])

  const getOverallScore = (scores: GestureScores) => {
    const values = Object.values(scores)
    return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length)
  }

  const getGestureScore = (scores: GestureScores, gesture: keyof GestureScores) => {
    return scores[gesture] || 1
  }

  const getInsights = (scores: GestureScores) => {
    const strengths = []
    const improvements = []

    // Analyze gesture scores and provide insights
    if (scores.hands_on_table > 5) {
      strengths.push("Good use of table for support")
    } else if (scores.hidden_hands > 5) {
      improvements.push("Try to keep hands visible for better engagement")
    }

    if (scores.gestures_on_table > 4) {
      strengths.push("Effective gesturing while maintaining table contact")
    }

    if (scores.self_touch > 4) {
      improvements.push("Try to minimize self-touching gestures (face, hair)")
    }

    return [
      { category: "Strengths", items: strengths.length > 0 ? strengths : ["Good overall performance"] },
      { category: "Areas for Improvement", items: improvements.length > 0 ? improvements : ["Continue practicing"] }
    ]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white flex items-center justify-center p-6">
        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-white">No Analysis Found</CardTitle>
            <p className="text-gray-400">Please upload a video first to see analysis results.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/upload">
              <Button className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800">
                Upload Video
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-800/50 bg-transparent">
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const insights = getInsights(analysisResult.gesture_scores)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/30 via-transparent to-gray-800/30 animate-gradient opacity-50"></div>
      <div className="absolute top-20 left-10 w-32 h-32 bg-gray-700/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gray-600/10 rounded-full blur-xl animate-pulse delay-1000"></div>

        {/* Navigation */}
      <nav className="p-6 border-b border-gray-800/50 backdrop-blur-sm relative z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/upload">
            <Button
              variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 border border-gray-700/50 hover:border-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Upload
            </Button>
          </Link>
            <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Gesture Analysis Results
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Your Gesture Analysis
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            AI-powered analysis of your interview gestures and body language
          </p>
          <Badge className="mt-4 bg-green-700/50 text-green-300 border-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            Analysis Complete
          </Badge>
        </motion.div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <ScoreGauge 
              title="Overall Performance" 
              score={getOverallScore(analysisResult.gesture_scores)} 
              color="gray" 
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <ScoreGauge 
              title="Hand Visibility" 
              score={Math.max(1, 8 - getGestureScore(analysisResult.gesture_scores, 'hidden_hands'))} 
              color="gray" 
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <ScoreGauge 
              title="Gesture Usage" 
              score={getGestureScore(analysisResult.gesture_scores, 'gestures_on_table')} 
              color="gray" 
            />
                    </motion.div>
                  </div>

        {/* Detailed Metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Gesture Analysis Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Hands on Table</span>
                    <span className="text-white font-semibold">{getGestureScore(analysisResult.gesture_scores, 'hands_on_table')}/10</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-gray-500 to-gray-700 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(getGestureScore(analysisResult.gesture_scores, 'hands_on_table') / 10) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Gestures on Table</span>
                    <span className="text-white font-semibold">{getGestureScore(analysisResult.gesture_scores, 'gestures_on_table')}/10</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                      className="bg-gradient-to-r from-gray-600 to-gray-800 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(getGestureScore(analysisResult.gesture_scores, 'gestures_on_table') / 7) * 100}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Self Touch</span>
                    <span className="text-white font-semibold">{getGestureScore(analysisResult.gesture_scores, 'self_touch')}/10</span>
                    </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                      className="bg-gradient-to-r from-gray-300 to-gray-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                      animate={{ width: `${(getGestureScore(analysisResult.gesture_scores, 'self_touch') / 7) * 100}%` }}
                      transition={{ duration: 1, delay: 1.1 }}
                      />
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.category}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.2 }}
              >
                <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {index === 0 ? (
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400" />
                      )}
                      {insight.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {insight.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-300 flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/upload">
            <Button className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 border border-gray-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
                Upload Another Video
              </Button>
            </Link>
          <Link href="/">
            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent">
              Back to Home
              </Button>
            </Link>
        </motion.div>
      </div>
    </div>
  )
}
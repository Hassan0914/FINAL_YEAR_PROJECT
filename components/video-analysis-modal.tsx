"use client"

import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Eye, Brain, TrendingUp, Upload, Loader2, AlertCircle } from "lucide-react"
import { ScoreGauge } from "@/components/score-gauge"
import { useState, useRef } from "react"

interface VideoAnalysisModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface GestureScores {
  hidden_hands: number
  hands_on_table: number
  gestures_on_table: number
  other_gestures: number
  self_touch: number
}

interface AnalysisResult {
  success: boolean
  gesture_scores: GestureScores
  frame_count: number
  message: string
}

export function VideoAnalysisModal({ open, onOpenChange }: VideoAnalysisModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setError(null)
      setAnalysisResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/gesture-prediction', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed')
      }

      setAnalysisResult(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getOverallScore = (scores: GestureScores) => {
    // Calculate overall score based on gesture scores
    const values = Object.values(scores)
    return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length)
  }

  const getGestureScore = (scores: GestureScores, gesture: keyof GestureScores) => {
    return scores[gesture] || 1
  }

  const getInsights = (scores: GestureScores) => {
    const insights = []
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

    if (scores.other_gestures > 4) {
      strengths.push("Good use of expressive gestures")
    } else {
      improvements.push("Consider using more hand gestures to emphasize points")
    }

    if (scores.self_touch > 4) {
      improvements.push("Try to minimize self-touching gestures (face, hair)")
    }

    return [
      { category: "Strengths", items: strengths.length > 0 ? strengths : ["Good overall performance"] },
      { category: "Areas for Improvement", items: improvements.length > 0 ? improvements : ["Continue practicing"] }
    ]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AI Gesture Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Section */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Video for Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-all duration-300 cursor-pointer hover:bg-gray-800/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <Play className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-300">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-300">Click to upload video</p>
                      <p className="text-sm text-gray-500">MP4, MOV, AVI up to 100MB</p>
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Analyze Gestures
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null)
                        setAnalysisResult(null)
                        setError(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="bg-red-900/20 border-red-700/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-300">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <>
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4 border border-gray-700">
                    <div className="text-center">
                      <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-300">Video Analysis Complete</p>
                      <p className="text-sm text-gray-500">{analysisResult.frame_count} frames processed</p>
                    </div>
                  </div>
                  <Badge className="bg-green-700/50 text-green-300 border-green-600">
                    Analysis Complete
                  </Badge>
                </CardContent>
              </Card>

              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    score={Math.max(getGestureScore(analysisResult.gesture_scores, 'other_gestures'), getGestureScore(analysisResult.gesture_scores, 'gestures_on_table'))} 
                    color="gray" 
                  />
                </motion.div>
              </div>

              {/* Detailed Metrics */}
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
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
                        <span className="text-white font-semibold">{getGestureScore(analysisResult.gesture_scores, 'hands_on_table')}/7</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-gray-500 to-gray-700 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(getGestureScore(analysisResult.gesture_scores, 'hands_on_table') / 7) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Gestures on Table</span>
                        <span className="text-white font-semibold">{getGestureScore(analysisResult.gesture_scores, 'gestures_on_table')}/7</span>
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
                        <span className="text-gray-300">Other Gestures</span>
                        <span className="text-white font-semibold">{getGestureScore(analysisResult.gesture_scores, 'other_gestures')}/7</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="bg-gradient-to-r from-gray-400 to-gray-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(getGestureScore(analysisResult.gesture_scores, 'other_gestures') / 7) * 100}%` }}
                          transition={{ duration: 1, delay: 0.9 }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Self Touch</span>
                        <span className="text-white font-semibold">{getGestureScore(analysisResult.gesture_scores, 'self_touch')}/7</span>
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

              {/* AI Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getInsights(analysisResult.gesture_scores).map((insight, index) => (
                  <motion.div
                    key={insight.category}
                    initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.2 }}
                  >
                    <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
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
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 hover:scale-105 transition-all duration-300 border border-gray-600">
              Get Full Analysis
            </Button>
            <Button
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-700 hover:scale-105 transition-all duration-300 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

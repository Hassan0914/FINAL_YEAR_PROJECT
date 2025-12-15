"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  History,
  Calendar,
  Video,
  TrendingUp,
  Smile,
  Hand,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { AuthModal } from "@/components/auth-modal"

interface AnalysisHistory {
  id: string
  videoName: string
  videoFileName: string
  // Gesture Analysis Scores
  handsOnTable: number | null
  hiddenHands: number | null
  gestureOnTable: number | null
  selfTouch: number | null
  otherGestures: number | null
  // Facial Analysis Score
  smileScore: number | null
  // Processing Metadata
  gestureFrames: number | null
  facialFrames: number | null
  processingTime: number | null
  gestureSuccess: boolean
  facialSuccess: boolean
  createdAt: string
}

export default function HistoryPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [analyses, setAnalyses] = useState<AnalysisHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  })

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/demo-dashboard")
      return
    }
    fetchHistory()
  }, [isLoggedIn, router])

  const fetchHistory = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/analysis-history?page=${page}&limit=10`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch history')
      }

      setAnalyses(result.data.analyses)
      setPagination(result.data.pagination)
    } catch (err) {
      console.error('Error fetching history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatScore = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'N/A'
    return score.toFixed(2)
  }

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
            <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
              <History className="w-6 h-6" />
              Analysis History
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Your Analysis History
          </h1>
          <p className="text-gray-300 text-lg">View all your previous gesture and facial expression analyses</p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-400">Loading history...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card className="bg-red-900/20 border-red-700/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-red-400">{error}</p>
              <Button
                onClick={() => fetchHistory(1)}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && analyses.length === 0 && (
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="pt-6 text-center py-12">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No Analysis History</h3>
              <p className="text-gray-400 mb-6">You haven't analyzed any videos yet.</p>
              <Link href="/upload">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700">
                  Upload Your First Video
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* History List */}
        {!loading && !error && analyses.length > 0 && (
          <div className="space-y-6">
            {analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Video className="w-5 h-5 text-gray-400" />
                          <CardTitle className="text-white">{analysis.videoName}</CardTitle>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(analysis.createdAt)}
                          </div>
                          {analysis.processingTime && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {analysis.processingTime.toFixed(2)}s
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {analysis.gestureSuccess && (
                          <Badge className="bg-green-900/50 text-green-300 border-green-700">
                            <Hand className="w-3 h-3 mr-1" />
                            Gesture
                          </Badge>
                        )}
                        {analysis.facialSuccess && (
                          <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">
                            <Smile className="w-3 h-3 mr-1" />
                            Facial
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Gesture Analysis Results */}
                      {analysis.gestureSuccess && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Hand className="w-4 h-4" />
                            Gesture Analysis
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-800/30 p-3 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Hidden Hands</div>
                              <div className="text-lg font-bold text-white">
                                {formatScore(analysis.hiddenHands)}/7
                              </div>
                            </div>
                            <div className="bg-gray-800/30 p-3 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Hands on Table</div>
                              <div className="text-lg font-bold text-white">
                                {formatScore(analysis.handsOnTable)}/7
                              </div>
                            </div>
                            <div className="bg-gray-800/30 p-3 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Gesture on Table</div>
                              <div className="text-lg font-bold text-white">
                                {formatScore(analysis.gestureOnTable)}/7
                              </div>
                            </div>
                            <div className="bg-gray-800/30 p-3 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Self Touch</div>
                              <div className="text-lg font-bold text-white">
                                {formatScore(analysis.selfTouch)}/7
                              </div>
                            </div>
                            <div className="bg-gray-800/30 p-3 rounded-lg col-span-2">
                              <div className="text-xs text-gray-400 mb-1">Other Gestures</div>
                              <div className="text-lg font-bold text-white">
                                {formatScore(analysis.otherGestures)}/7
                              </div>
                            </div>
                          </div>
                          {analysis.gestureFrames && (
                            <div className="text-xs text-gray-500 mt-2">
                              {analysis.gestureFrames} frames processed
                            </div>
                          )}
                        </div>
                      )}

                      {/* Facial Analysis Results */}
                      {analysis.facialSuccess && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Smile className="w-4 h-4" />
                            Facial Expression Analysis
                          </h4>
                          <div className="bg-gray-800/30 p-4 rounded-lg">
                            <div className="mb-3">
                              <div className="text-xs text-gray-400 mb-1">Smile Score</div>
                              <div className="text-3xl font-bold text-white">
                                {formatScore(analysis.smileScore)}/7
                              </div>
                            </div>
                            {analysis.facialFrames && (
                              <div className="text-xs text-gray-500">
                                {analysis.facialFrames} frames processed
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => fetchHistory(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
                >
                  Previous
                </Button>
                <span className="text-gray-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => fetchHistory(pagination.page + 1)}
                  disabled={!pagination.hasMore}
                  className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}


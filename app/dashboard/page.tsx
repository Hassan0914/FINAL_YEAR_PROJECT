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
  History,
  Hand,
  Smile,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { PerformanceChart } from "@/components/performance-chart"
import { RadarChart } from "@/components/radar-chart"
import { ScoreGauge } from "@/components/score-gauge"
import { AuthModal } from "@/components/auth-modal"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Interview {
  id: string
  date: string
  company: string
  score: number | null
  status: string | null
  isNew: boolean
  isEmpty?: boolean
  createdAt?: string
  finalScore?: number | null
}

export default function DashboardPage() {
  const router = useRouter()
  const { isLoggedIn, logout, user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [gestureAnalysis, setGestureAnalysis] = useState<any>(null)
  const [facialAnalysis, setFacialAnalysis] = useState<any>(null)
  const [voiceAnalysis, setVoiceAnalysis] = useState<any>(null)
  const [recentInterviews, setRecentInterviews] = useState<Interview[]>([])
  const [allInterviews, setAllInterviews] = useState<Interview[]>([])
  const [analysisCount, setAnalysisCount] = useState(0)
  const [loadingInterviews, setLoadingInterviews] = useState(true)
  const [latestOverallScore, setLatestOverallScore] = useState<number | null>(null)
  const [previousOverallScore, setPreviousOverallScore] = useState<number | null>(null)
  
  // Get user's first name for greeting
  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  // Fetch recent interviews from database
  const fetchRecentInterviews = async () => {
    try {
      setLoadingInterviews(true)
      // Fetch recent 4 for the cards
      const recentResponse = await fetch('/api/analysis-history?page=1&limit=4')
      const recentResult = await recentResponse.json()
      
      // Fetch max 10 interviews for the chart
      const allResponse = await fetch('/api/analysis-history?page=1&limit=10')
      const allResult = await allResponse.json()
      
      const result = recentResult
      const response = recentResponse

      if (response.ok && result.success) {
        const totalCount = result.data.pagination.total
        const interviews = result.data.analyses.map((analysis: any, index: number) => {
          // Calculate overall score from gesture scores
          // Note: hiddenHands is inverted (lower is better), so we convert it to a positive score
          const positiveScores = [
            analysis.handsOnTable,
            analysis.gestureOnTable,
            analysis.selfTouch,
          ].filter(s => s !== null && s !== undefined) as number[]
          
          // Convert hiddenHands to positive (10 - hiddenHands, since lower hiddenHands = better)
          let hiddenHandsScore = null
          if (analysis.hiddenHands !== null && analysis.hiddenHands !== undefined) {
            hiddenHandsScore = Math.max(0, 10 - analysis.hiddenHands)
            positiveScores.push(hiddenHandsScore)
          }
          
          // Use finalScore if available (from weighted fusion), otherwise calculate from gesture scores
          let overallScore = analysis.finalScore
          
          if (overallScore === null || overallScore === undefined) {
            // Fallback: Calculate overall score from gesture scores
            overallScore = positiveScores.length > 0
              ? Math.round((positiveScores.reduce((a: number, b: number) => a + b, 0) / positiveScores.length) * 10) / 10
              : null
          }

          // Format date as "12 Feb" style
          const date = new Date(analysis.createdAt)
          const formattedDate = date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short'
          })

          // Generate a nice name for the interview
          // Use "Interview 1", "Interview 2", etc. based on reverse order (newest = 1)
          const interviewNumber = totalCount - index
          const niceName = `Interview ${interviewNumber}`

          return {
            id: analysis.id,
            date: formattedDate,
            company: niceName,
            score: overallScore,
            status: overallScore ? (overallScore >= 8 ? 'Excellent' : overallScore >= 6 ? 'Good' : overallScore >= 4 ? 'Fair' : 'Needs Improvement') : null,
            isNew: index === 0,
            createdAt: analysis.createdAt,
            finalScore: analysis.finalScore,
          }
        })

        // Pad to 4 slots with empty entries
        while (interviews.length < 4) {
          interviews.push({
            id: `empty-${interviews.length}`,
            date: '—',
            company: '—',
            score: null,
            status: null,
            isNew: false,
            isEmpty: true,
          } as Interview)
        }

        setRecentInterviews(interviews)
        setAnalysisCount(result.data.pagination.total)
        
        // Set latest and previous overall scores for improvement calculation
        if (interviews.length > 0 && interviews[0].score !== null) {
          setLatestOverallScore(interviews[0].score)
        }
        if (interviews.length > 1 && interviews[1].score !== null) {
          setPreviousOverallScore(interviews[1].score)
        }
        
        // Process all interviews for chart
        if (allResponse.ok && allResult.success && allResult.data.analyses) {
          const allInterviewsData = allResult.data.analyses.map((analysis: any, index: number) => {
            let overallScore = analysis.finalScore
            if (overallScore === null || overallScore === undefined) {
              const positiveScores = [
                analysis.handsOnTable,
                analysis.gestureOnTable,
                analysis.selfTouch,
              ].filter(s => s !== null && s !== undefined) as number[]
              let hiddenHandsScore = null
              if (analysis.hiddenHands !== null && analysis.hiddenHands !== undefined) {
                hiddenHandsScore = Math.max(0, 10 - analysis.hiddenHands)
                positiveScores.push(hiddenHandsScore)
              }
              overallScore = positiveScores.length > 0
                ? Math.round((positiveScores.reduce((a: number, b: number) => a + b, 0) / positiveScores.length) * 10) / 10
                : null
            }
            const totalCount = allResult.data.pagination.total
            const interviewNumber = totalCount - index
            return {
              id: analysis.id,
              date: new Date(analysis.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
              company: `Interview ${interviewNumber}`,
              score: overallScore,
              status: overallScore ? (overallScore >= 8 ? 'Excellent' : overallScore >= 6 ? 'Good' : overallScore >= 4 ? 'Fair' : 'Needs Improvement') : null,
              isNew: index === 0,
              createdAt: analysis.createdAt,
              finalScore: analysis.finalScore,
            }
          })
          const filteredInterviews = allInterviewsData.filter((i: Interview) => i.score !== null)
          setAllInterviews(filteredInterviews)
          console.log('All interviews for chart:', filteredInterviews.length, filteredInterviews)
        } else {
          console.log('Chart data fetch failed:', allResponse.ok, allResult)
        }
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
      // Set empty interviews on error
      setRecentInterviews([
        { id: 'empty-1', date: '—', company: '—', score: null, status: null, isNew: false, isEmpty: true } as Interview,
        { id: 'empty-2', date: '—', company: '—', score: null, status: null, isNew: false, isEmpty: true } as Interview,
        { id: 'empty-3', date: '—', company: '—', score: null, status: null, isNew: false, isEmpty: true } as Interview,
        { id: 'empty-4', date: '—', company: '—', score: null, status: null, isNew: false, isEmpty: true } as Interview,
      ])
    } finally {
      setLoadingInterviews(false)
    }
  }

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/demo-dashboard")
      return
    }
    
    // Fetch recent interviews
    fetchRecentInterviews()
    
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

  // Generate detailed insights for gesture analysis
  const generateGestureInsights = () => {
    if (!gestureAnalysis?.gesture_scores) return []

    const scores = gestureAnalysis.gesture_scores
    const insights = []

    // Helper to get score level (dark theme colors - gray theme)
    const getScoreLevel = (score: number, isPositive: boolean = true) => {
      const effectiveScore = isPositive ? score : (10 - score)
      if (effectiveScore >= 8) return { level: 'excellent', color: 'text-gray-300', bgColor: 'bg-gray-700/20', borderColor: 'border-gray-600/30' }
      if (effectiveScore >= 6) return { level: 'good', color: 'text-gray-300', bgColor: 'bg-gray-700/20', borderColor: 'border-gray-600/30' }
      if (effectiveScore >= 4) return { level: 'fair', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' }
      return { level: 'needs-improvement', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' }
    }

    // Hands on Table (POSITIVE) - Only hands/wrists, not full arms
    if (scores.hands_on_table !== null && scores.hands_on_table !== undefined) {
      const scoreInfo = getScoreLevel(scores.hands_on_table, true)
      const percentage = Math.round(scores.hands_on_table * 10)
      insights.push({
        category: 'Hands on Table',
        icon: Hand,
        score: scores.hands_on_table,
        scoreInfo,
        plainLanguage: `Your hands (up to wrists) were visible on or near the table ${percentage}% of the time during the interview.`,
        whatItMeans: scoreInfo.level === 'excellent' 
          ? 'This indicates strong confidence and transparency in your communication. You maintained proper hand positioning (hands/wrists only, not full arms).'
          : scoreInfo.level === 'good'
          ? 'This shows good engagement and professional presence with controlled hand positioning.'
          : scoreInfo.level === 'fair'
          ? 'You demonstrated moderate openness, but there\'s room for improvement in maintaining visible hand positioning.'
          : 'Your hands were less visible, which may reduce perceived confidence.',
        whyItMatters: 'Visible hands on the table (hands and wrists only, not full arms) demonstrate openness, honesty, and confidence. Research distinguishes between hand-only positioning (positive) and full arm positioning (negative). Studies show that interviewers perceive candidates with visible hands as more trustworthy and transparent (Vrij, 2008; Ekman, 2003).',
        researchBacking: 'Studies by Ekman (2003) and Mehrabian (1972) found that visible hands (hands/wrists only) correlate with perceived honesty and confidence. Burgoon et al. (2016) showed it reduces perception of deception. Alshammari et al. (2023) and Chen et al. (2023) distinguish between hand-only gestures (positive) and full arm positioning (negative).',
        tips: scoreInfo.level === 'excellent'
          ? ['Continue maintaining this positive habit', 'Use hand and wrist gestures to emphasize key points', 'Remember: hands/wrists on table are positive, but avoid full arm positioning']
          : ['Practice placing hands (up to wrists) on the table naturally', 'Avoid hiding hands under the table', 'Use controlled hand and wrist movements to show engagement', 'Keep arms mobile - only hands/wrists should rest on table']
      })
    }

    // Hand Visibility (NEGATIVE - inverted) - Cross-reference with Hands on Table and Gestures on Table
    if (scores.hidden_hands !== null && scores.hidden_hands !== undefined) {
      const scoreInfo = getScoreLevel(scores.hidden_hands, false)
      const visibilityScore = 10 - scores.hidden_hands
      const percentage = Math.round(visibilityScore * 10)
      
      // Check if we have both Hands on Table and Gestures on Table scores for cross-referencing
      const hasHandsOnTable = scores.hands_on_table !== null && scores.hands_on_table !== undefined
      const hasGesturesOnTable = scores.gestures_on_table !== null && scores.gestures_on_table !== undefined
      const handsOnTableScore = scores.hands_on_table || 0
      const gesturesOnTableScore = scores.gestures_on_table || 0
      
      let crossReferenceNote = ''
      if (hasHandsOnTable && hasGesturesOnTable) {
        if (handsOnTableScore > 7 && gesturesOnTableScore < 3) {
          crossReferenceNote = ' Your analysis shows excellent "Hands on Table" positioning (hands/wrists only) and low "Gestures on Table" (full arms), which is the ideal combination. This confirms you\'re using proper hand positioning rather than full arm positioning.'
        } else if (handsOnTableScore > 5 && gesturesOnTableScore > 5) {
          crossReferenceNote = ' Note: While your hands are visible, your "Gestures on Table" score indicates frequent full arm positioning. Remember: only hands/wrists on table are positive - full arms resting on table are considered negative and can limit expressiveness.'
        } else {
          crossReferenceNote = ' Important distinction: Only hands and wrists on the table are considered positive. Full arms (more than wrists) resting on the table are negative and can indicate constraint.'
        }
      } else {
        crossReferenceNote = ' Important: Only hands and wrists on the table are considered positive. Full arms (more than wrists) resting on the table are negative and can limit expressiveness.'
      }
      
      insights.push({
        category: 'Hand Visibility',
        icon: Eye,
        score: visibilityScore,
        rawScore: scores.hidden_hands,
        scoreInfo,
        plainLanguage: `Your hands were visible ${percentage}% of the time (hidden ${Math.round(scores.hidden_hands * 10)}% of the time).`,
        whatItMeans: scoreInfo.level === 'excellent'
          ? `Excellent hand visibility indicates strong confidence and transparency. Your hands (up to wrists) are properly positioned and visible.${crossReferenceNote}`
          : scoreInfo.level === 'good'
          ? `Good hand visibility shows professional presence. Ensure you're using hands/wrists positioning, not full arms.${crossReferenceNote}`
          : scoreInfo.level === 'fair'
          ? `Moderate visibility - consider keeping hands more visible. Remember: hands/wrists on table are positive, but full arms are negative.${crossReferenceNote}`
          : `Low hand visibility may signal nervousness or discomfort to interviewers. Focus on keeping hands/wrists visible on the table.${crossReferenceNote}`,
        whyItMatters: 'Hidden hands are associated with deception, nervousness, and lack of confidence. Research by Vrij (2008) and Ekman (2003) shows that visible hands significantly increase perceived trustworthiness. However, it\'s important to note that only hands and wrists on the table are positive - full arms resting on the table are considered negative (Alshammari et al., 2023; Chen et al., 2023).',
        researchBacking: 'Vrij (2008) found that hidden hands are a strong indicator of deception. Ekman (2003) and Burgoon et al. (2016) showed that visible hands reduce perception of deception and increase trust. Research by Alshammari et al. (2023) and Chen et al. (2023) distinguishes between hand-only positioning (positive) and full arm positioning (negative), showing that full arms on table indicate constraint and reduced expressiveness.',
        tips: scoreInfo.level === 'excellent'
          ? ['Maintain this excellent habit', 'Continue using visible hand and wrist gestures', 'Remember: hands/wrists on table are positive, but avoid full arm positioning']
          : ['Keep hands and wrists visible on the table or in front of you', 'Avoid placing hands in pockets or under the table', 'Practice in front of a mirror to build confidence', 'Focus on hand/wrist positioning, not full arm positioning']
      })
    }

    // Gestures on Table (NEGATIVE - inverted) - Full arms, not just hands/wrists
    if (scores.gestures_on_table !== null && scores.gestures_on_table !== undefined) {
      const scoreInfo = getScoreLevel(scores.gestures_on_table, false)
      const effectiveScore = 10 - scores.gestures_on_table
      const fullArmsPercentage = Math.round(scores.gestures_on_table * 10)
      
      insights.push({
        category: 'Gestures on Table',
        icon: Hand,
        score: effectiveScore,
        rawScore: scores.gestures_on_table,
        scoreInfo,
        plainLanguage: `Your full arms (more than wrists) were resting or moving on the table ${fullArmsPercentage}% of the time.`,
        whatItMeans: scoreInfo.level === 'excellent'
          ? 'You avoided full arm positioning, allowing for more expressive gestures. You correctly used only hands/wrists on the table, which is the positive approach.'
          : scoreInfo.level === 'good'
          ? 'You mostly used controlled hand and wrist movements rather than full arm positioning. This is the correct approach.'
          : scoreInfo.level === 'fair'
          ? 'You sometimes positioned full arms on the table, which can limit expressiveness. Remember: only hands/wrists on table are positive, not full arms.'
          : 'Frequent full arm positioning on the table can indicate constraint and reduce gesture range. Focus on using only hands/wrists on the table, not full arms.',
        whyItMatters: 'Important distinction: Only hands and wrists on the table are considered positive. Full arms (more than wrists) resting or moving on the table indicate constraint and reduced expressiveness. Research by Alshammari et al. (2023) and Chen et al. (2023) clearly distinguishes between hand-only positioning (positive) and full arm positioning (negative). Full arms on table reduce gesture range and dynamic communication, and can signal nervousness.',
        researchBacking: 'Alshammari et al. (2023) and Chen et al. (2023) distinguish between hand-only gestures (positive) and full arm positioning (negative). Research shows that while hands/wrists on table demonstrate openness and confidence, full arms on table indicate constraint, reduced expressiveness, and can signal nervousness. Ramanarayanan et al. (2015) found that full arm positioning limits gesture range and dynamic communication.',
        tips: scoreInfo.level === 'excellent'
          ? ['Continue using controlled hand and wrist gestures', 'Maintain this balanced approach - hands/wrists only', 'Keep arms mobile while using hands/wrists on table']
          : ['Use hand and wrist movements only - avoid full arm positioning', 'Practice gestures that extend beyond the table edge with hands/wrists', 'Focus on expressive hand movements while keeping arms mobile', 'Remember: hands/wrists on table = positive, full arms = negative']
      })
    }

    // Self Touch (NEGATIVE - inverted)
    if (scores.self_touch !== null && scores.self_touch !== undefined) {
      const scoreInfo = getScoreLevel(scores.self_touch, false)
      const effectiveScore = 10 - scores.self_touch
      insights.push({
        category: 'Self Touch',
        icon: Hand,
        score: effectiveScore,
        rawScore: scores.self_touch,
        scoreInfo,
        plainLanguage: `You engaged in self-touching gestures (face, hair, body) ${Math.round(scores.self_touch * 10)}% of the time.`,
        whatItMeans: scoreInfo.level === 'excellent'
          ? 'Minimal self-touching indicates strong confidence and composure.'
          : scoreInfo.level === 'good'
          ? 'Low self-touching shows good self-control and professionalism.'
          : scoreInfo.level === 'fair'
          ? 'Moderate self-touching may indicate some nervousness or discomfort.'
          : 'Frequent self-touching can signal anxiety, stress, or lack of confidence to interviewers.',
        whyItMatters: 'Self-touching gestures (touching face, hair, or body) are associated with anxiety, stress, and nervousness. Research shows these behaviors can reduce perceived professionalism and indicate internal conflict (Ekman & Friesen, 1969; Morris, 1994).',
        researchBacking: 'Ekman & Friesen (1969) identified self-touch as a displacement behavior indicating anxiety. Mehrabian (1972) and Vrij (2008) found it correlates with discomfort and can signal deception or unease.',
        tips: scoreInfo.level === 'excellent'
          ? ['Maintain this composed behavior', 'Continue practicing confident body language']
          : ['Practice keeping hands away from your face', 'Use purposeful hand gestures instead of self-touching', 'Record yourself to identify self-touching patterns', 'Practice relaxation techniques to reduce anxiety']
      })
    }

    // Smile (POSITIVE)
    if (facialAnalysis?.smile_score !== null && facialAnalysis?.smile_score !== undefined) {
      const scoreInfo = getScoreLevel(facialAnalysis.smile_score, true)
      insights.push({
        category: 'Smile & Engagement',
        icon: Smile,
        score: facialAnalysis.smile_score,
        scoreInfo,
        plainLanguage: `Your smile and facial engagement score was ${facialAnalysis.smile_score.toFixed(1)}/10.`,
        whatItMeans: scoreInfo.level === 'excellent'
          ? 'Excellent facial engagement shows strong positivity and approachability.'
          : scoreInfo.level === 'good'
          ? 'Good facial engagement indicates friendliness and professional warmth.'
          : scoreInfo.level === 'fair'
          ? 'Moderate engagement - consider showing more natural expressions.'
          : 'Low engagement may reduce perceived friendliness and approachability.',
        whyItMatters: 'A natural smile and positive facial expressions indicate friendliness, engagement, and a positive attitude. Research shows this correlates with perceived competence and likability (Ambady & Rosenthal, 1993; Ekman, 2003).',
        researchBacking: 'Ambady & Rosenthal (1993) found that positive facial expressions correlate with perceived competence. Ekman (2003) and Mehrabian (1972) showed that smiles enhance interpersonal rapport and professional warmth.',
        tips: scoreInfo.level === 'excellent'
          ? ['Continue maintaining natural, positive expressions', 'Your engagement level is excellent']
          : ['Practice maintaining a natural, genuine smile', 'Focus on showing interest through facial expressions', 'Record yourself to see your natural expressions', 'Practice in front of a mirror to build confidence']
      })
    }

    return insights
  }

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
          overallScore: gestureAnalysis.overall_score || latestOverallScore,
          frameCount: gestureAnalysis.frame_count,
          facialAnalysis: facialAnalysis,
          landmarksSummary: gestureAnalysis.landmarks_summary,
          voiceConfidence: voiceAnalysis?.confidence || gestureAnalysis.voice_confidence,
          previousOverallScore: previousOverallScore,
          analysisCount: analysisCount
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

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short'
    })
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
            <Link href="/history">
              <Button
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Button
              onClick={handleUploadClick}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
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
            Hey {userName.charAt(0).toUpperCase() + userName.slice(1)}! 👋
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
                  {latestOverallScore !== null ? `${latestOverallScore.toFixed(1)}/10` : '—'}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {latestOverallScore !== null ? 'Latest analysis' : 'No analysis yet'}
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
                  <TrendingUp className="w-4 h-4" />
                  Improvement from Last Interview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {latestOverallScore !== null && previousOverallScore !== null ? (
                    <span className={latestOverallScore > previousOverallScore ? 'text-green-400' : latestOverallScore < previousOverallScore ? 'text-red-400' : 'text-white'}>
                      {latestOverallScore > previousOverallScore ? '+' : latestOverallScore < previousOverallScore ? '-' : ''}
                      {Math.abs(latestOverallScore - previousOverallScore).toFixed(1)}
                    </span>
                  ) : latestOverallScore !== null ? (
                    <span className="text-gray-400">First analysis</span>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {latestOverallScore !== null && previousOverallScore !== null ? (
                    latestOverallScore > previousOverallScore ? 'Improved from last' : 
                    latestOverallScore < previousOverallScore ? 'Declined from last' : 
                    'Same as last'
                  ) : latestOverallScore !== null ? (
                    'No previous analysis'
                  ) : (
                    'No analysis yet'
                  )}
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
                  <Users className="w-4 h-4" />
                  Total Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-1">
                  {loadingInterviews ? '...' : analysisCount}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {analysisCount === 0 ? 'No analyses yet' : analysisCount === 1 ? 'Analysis completed' : 'Analyses completed'}
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
                  {gestureAnalysis ? gestureAnalysis.frame_count : '—'}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  {gestureAnalysis ? 'Frames processed' : 'No analysis yet'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section - Hidden when no data */}
        {recentInterviews.some(i => !i.isEmpty) && (
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
                  {(allInterviews.length > 0 || recentInterviews.filter(i => !i.isEmpty && i.score !== null).length > 0) ? (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={(allInterviews.length > 0 ? allInterviews : recentInterviews.filter(i => !i.isEmpty && i.score !== null))
                            .slice(0, 10) // Limit to max 10 records
                            .map((interview) => {
                              // Shorten interview name: "Interview 10" -> "I10"
                              const shortName = interview.company.replace('Interview ', 'I')
                              return {
                                name: shortName,
                                fullName: interview.company,
                                score: interview.score || 0,
                                date: interview.date
                              }
                            })
                            .reverse() // Show oldest to newest
                          }
                          margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                          barSize={40}
                        >
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#374151" 
                            opacity={0.3}
                            vertical={false}
                          />
                          <XAxis 
                            dataKey="name" 
                            stroke="#6B7280" 
                            tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                            axisLine={{ stroke: '#4B5563' }}
                            tickLine={{ stroke: '#4B5563' }}
                          />
                          <YAxis 
                            stroke="#6B7280" 
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            domain={[0, 10]}
                            axisLine={{ stroke: '#4B5563' }}
                            tickLine={{ stroke: '#4B5563' }}
                            label={{ 
                              value: 'Score (out of 10)', 
                              angle: -90, 
                              position: 'insideLeft', 
                              fill: '#9CA3AF',
                              style: { fontSize: '12px', fontWeight: 500 }
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111827",
                              border: "1px solid #374151",
                              borderRadius: "8px",
                              color: "#F9FAFB",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
                            }}
                            cursor={{ fill: 'rgba(107, 114, 128, 0.1)' }}
                            formatter={(value: any) => [`${value.toFixed(1)}/10`, 'Score']}
                            labelFormatter={(label, payload) => {
                              const fullName = payload?.[0]?.payload?.fullName || label
                              return `📊 ${fullName}`
                            }}
                            labelStyle={{ color: '#D1D5DB', fontWeight: 600, marginBottom: '4px' }}
                          />
                          <Bar 
                            dataKey="score" 
                            fill="url(#dashboardGradient)" 
                            radius={[6, 6, 0, 0]}
                            stroke="#4B5563"
                            strokeWidth={1}
                          />
                          <defs>
                            <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#9CA3AF" stopOpacity={0.9} />
                              <stop offset="50%" stopColor="#6B7280" stopOpacity={0.8} />
                              <stop offset="100%" stopColor="#4B5563" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No interview data available
                    </div>
                  )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/30 transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                    Feedback
                </CardTitle>
                  <CardDescription className="text-gray-400">Detailed insights into your interview performance</CardDescription>
              </CardHeader>
              <CardContent>
                  {gestureAnalysis?.gesture_scores ? (
                    <div className="h-[350px] overflow-y-auto flex flex-col">
                      <Accordion type="single" collapsible className="w-full space-y-3 flex-1 pb-4">
                      {generateGestureInsights().map((insight, index) => {
                        const Icon = insight.icon
                        return (
                          <AccordionItem
                            key={index}
                            value={`item-${index}`}
                            className={`border ${insight.scoreInfo.borderColor} rounded-lg ${insight.scoreInfo.bgColor} px-3`}
                          >
                            <AccordionTrigger className="hover:no-underline py-3.5">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-2.5">
                                  <Icon className={`w-4 h-4 ${insight.scoreInfo.color}`} />
                                  <div className="text-left">
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-semibold text-sm">{insight.category}</span>
                                      <Badge className={`${insight.scoreInfo.bgColor} ${insight.scoreInfo.color} border-0 text-xs px-1.5 py-0.5`}>
                                        {insight.score.toFixed(1)}/10
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{insight.plainLanguage}</p>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4">
                              <div className="space-y-3 pl-6">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <Info className="w-3.5 h-3.5 text-gray-400" />
                                    <h4 className="text-xs font-semibold text-gray-300">What This Means</h4>
                                  </div>
                                  <p className="text-xs text-gray-400 leading-relaxed">{insight.whatItMeans}</p>
                                </div>
                                
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                                    <h4 className="text-xs font-semibold text-gray-300">Why This Matters</h4>
                                  </div>
                                  <p className="text-xs text-gray-400 leading-relaxed">{insight.whyItMatters}</p>
                                </div>
                                
                                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                    <h4 className="text-xs font-semibold text-gray-300">Research Insight</h4>
                                  </div>
                                  <p className="text-xs text-gray-400 leading-relaxed">{insight.researchBacking}</p>
                                </div>
                                
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                                    <h4 className="text-xs font-semibold text-gray-300">Actionable Tips</h4>
                                  </div>
                                  <ul className="space-y-1">
                                    {insight.tips.map((tip, tipIndex) => (
                                      <li key={tipIndex} className="text-xs text-gray-400 flex items-start gap-1.5">
                                        <span className="text-gray-500 mt-1">•</span>
                                        <span>{tip}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Complete an interview analysis to see detailed insights</p>
                      <Button
                        onClick={handleUploadClick}
                        variant="outline"
                        className="mt-4 border-gray-600 text-white hover:bg-gray-800/50 bg-transparent"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Video
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
        )}

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
                  AI-powered analysis of your interview gestures and body language (1-10 scale)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.hidden_hands?.toFixed(2) || '0.00'}/10
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Hidden Hands</div>
                    <div className="text-xs text-gray-400">Hands not visible</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.hands_on_table?.toFixed(2) || '0.00'}/10
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Hands on Table</div>
                    <div className="text-xs text-gray-400">Resting on table</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.gestures_on_table?.toFixed(2) || '0.00'}/10
                    </div>
                    <div className="text-sm text-gray-300 mb-1">Gestures on Table</div>
                    <div className="text-xs text-gray-400">Gesturing near table</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-2">
                      {gestureAnalysis.gesture_scores?.self_touch?.toFixed(2) || '0.00'}/10
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
                      {facialAnalysis.smile_score ? facialAnalysis.smile_score.toFixed(2) : '0.00'}/10
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
                  AI-powered analysis of your voice tone and confidence (1-10 scale)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {voiceAnalysis.engaging_tone}/10
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
                <ScoreGauge 
                  title="Confidence Level" 
                  score={gestureAnalysis?.gesture_scores?.hidden_hands !== null && gestureAnalysis?.gesture_scores?.hidden_hands !== undefined
                    ? Math.round((10 - gestureAnalysis.gesture_scores.hidden_hands) * 10)
                    : latestOverallScore !== null 
                    ? Math.round(latestOverallScore * 10)
                    : 0} 
                  color="gray" 
                />
                <ScoreGauge 
                  title="Communication" 
                  score={gestureAnalysis?.gesture_scores?.hands_on_table !== null && gestureAnalysis?.gesture_scores?.hands_on_table !== undefined
                    ? Math.round(gestureAnalysis.gesture_scores.hands_on_table * 10)
                    : latestOverallScore !== null 
                    ? Math.round(latestOverallScore * 10)
                    : 0} 
                  color="gray" 
                />
                <ScoreGauge 
                  title="Engagement" 
                  score={facialAnalysis?.smile_score !== null && facialAnalysis?.smile_score !== undefined
                    ? Math.round(facialAnalysis.smile_score * 10)
                    : 0} 
                  color="gray" 
                />
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
              {loadingInterviews ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-400">Loading interviews...</div>
                </div>
              ) : (
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
                          <span className="text-white font-bold">
                            {interview.isEmpty || interview.score === null ? '—' : interview.score}
                          </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-white font-medium">{interview.company}</div>
                            {interview.isNew && !interview.isEmpty && (
                            <Badge className="bg-gray-700/50 text-gray-300 border-gray-600 text-xs">New</Badge>
                          )}
                        </div>
                        <div className="text-gray-400 text-sm">{interview.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {interview.isEmpty || interview.status === null ? (
                          <span className="text-gray-500">—</span>
                        ) : (
                          <>
                      <Badge variant="secondary" className="bg-gray-700/50 text-gray-300 border-gray-600">
                        {interview.status}
                      </Badge>
                            <Link href="/history">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-300 hover:text-white hover:bg-gray-700/50"
                          >
                            View Analysis
                          </Button>
                        </Link>
                          </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}

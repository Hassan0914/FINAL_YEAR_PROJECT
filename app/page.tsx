"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Mic, Brain, Upload, Play, BarChart3, Zap, Shield, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { FeatureCard } from "@/components/feature-card"
import { VideoAnalysisModal } from "@/components/video-analysis-modal"
import { LearnMoreModal } from "@/components/learn-more-modal"
import { AuthModal } from "@/components/auth-modal"
import { AnimatedDemo } from "@/components/animated-demo"
import { useAuth } from "@/hooks/use-auth"

export default function HomePage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(false)
  const [showLearnMore, setShowLearnMore] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showAnimatedDemo, setShowAnimatedDemo] = useState(false)

  const handleUploadClick = () => {
    if (isLoggedIn) {
      router.push("/upload")
    } else {
      setShowAuthModal(true)
    }
  }

  const handleDashboardClick = () => {
    if (isLoggedIn) {
      router.push("/dashboard")
    } else {
      router.push("/demo-dashboard")
    }
  }

  const handleDemo = () => {
    setShowAnimatedDemo(true)
  }

  const handleDemoComplete = () => {
    setShowAnimatedDemo(false)
    setShowAuthModal(true)
  }

  const features = [
    {
      icon: Eye,
      title: "Real-time Body Language Scoring",
      description:
        "Advanced AI analyzes your posture, gestures, and overall body language to provide instant feedback.",
      color: "from-gray-600 to-gray-800",
    },
    {
      icon: Mic,
      title: "Eye Contact & Gesture Analysis",
      description: "Track eye contact patterns and gesture effectiveness with precision computer vision technology.",
      color: "from-gray-700 to-gray-900",
    },
    {
      icon: Brain,
      title: "HR-Validated Confidence Evaluation",
      description: "Get confidence scores based on proven HR assessment criteria and industry standards.",
      color: "from-gray-800 to-black",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white overflow-hidden relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/30 via-transparent to-gray-800/30 animate-gradient opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/20 via-transparent to-transparent"></div>

      {/* Floating shapes for premium look */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gray-700/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-gray-600/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      {/* Navigation */}
      <nav className="relative z-10 p-6 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
          >
            InterviewAI
          </motion.div>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={handleDashboardClick}
              className="text-white hover:bg-white/10 hover:scale-105 transition-all duration-300 border border-gray-700/50 hover:border-gray-600"
            >
              Dashboard
            </Button>
            <Button
              size="lg"
              onClick={() => setShowAuthModal(true)}
              className="bg-gray-800/50 hover:bg-gray-700/50 text-lg px-8 py-4 hover:scale-105 transition-all duration-300 border border-gray-600 shadow-lg text-white backdrop-blur-sm"
            >
              <Target className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Badge className="mb-6 bg-gray-800/50 text-gray-300 border-gray-700/50 backdrop-blur-sm">
              <Zap className="w-4 h-4 mr-2" />
              Powered by Advanced AI
            </Badge>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Evaluate Your Interview Performance with AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Get instant, actionable feedback on your interview skills with our cutting-edge AI technology. Improve
              your confidence, body language, and communication.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button
              size="lg"
              className="bg-gray-800/50 hover:bg-gray-700/50 text-lg px-8 py-4 hover:scale-105 transition-all duration-300 border border-gray-600 shadow-lg text-white backdrop-blur-sm"
              onClick={handleDemo}
            >
              <Play className="w-5 h-5 mr-2" />
              Try Demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800/50 text-lg px-8 py-4 bg-transparent hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              onClick={() => setShowLearnMore(true)}
            >
              Learn More
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Advanced AI Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our sophisticated AI analyzes every aspect of your interview performance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-200 to-gray-500 bg-clip-text text-transparent">
              See It In Action
            </h2>
            <p className="text-xl text-gray-300">Upload a short interview video and get instant AI-powered feedback</p>
          </motion.div>

          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Interview Video
              </CardTitle>
              <CardDescription className="text-gray-400">Upload a 30-60 second video for AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-gray-500 transition-all duration-300 cursor-pointer hover:bg-gray-800/30"
                onClick={handleUploadClick}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-2">MP4, MOV up to 100MB</p>
                <p className="text-xs text-gray-600 mt-2">Login required to upload videos</p>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have improved their interview skills with our AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowAuthModal(true)}
                className="bg-gray-800/50 hover:bg-gray-700/50 text-lg px-8 py-4 hover:scale-105 transition-all duration-300 border border-gray-600 shadow-lg text-white backdrop-blur-sm"
              >
                <Target className="w-5 h-5 mr-2" />
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDashboardClick}
                className="border-gray-600 text-white hover:bg-gray-800/50 text-lg px-8 py-4 bg-transparent hover:scale-105 transition-all duration-300 backdrop-blur-sm"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                View Dashboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/50 px-6 py-12 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
            InterviewAI
          </div>
          <p className="text-gray-400 mb-6">Empowering professionals with AI-driven interview preparation</p>
          <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Secure • Private • Professional</span>
          </div>
        </div>
      </footer>

      <VideoAnalysisModal open={showVideoAnalysis} onOpenChange={setShowVideoAnalysis} />
      <LearnMoreModal open={showLearnMore} onOpenChange={setShowLearnMore} />
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <AnimatedDemo open={showAnimatedDemo} onOpenChange={setShowAnimatedDemo} onComplete={handleDemoComplete} />
    </div>
  )
}

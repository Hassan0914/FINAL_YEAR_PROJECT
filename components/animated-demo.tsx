"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  User,
  Mail,
  Video,
  Brain,
  Eye,
  CheckCircle,
  ArrowRight,
  Award,
  TrendingUp,
  Mic,
  BarChart3,
  Target,
  X,
  MousePointer,
  Play,
} from "lucide-react"
import { ScoreGauge } from "@/components/score-gauge"
import { RadarChart } from "@/components/radar-chart"

interface AnimatedDemoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

type DemoStep = "intro" | "click-dashboard" | "signup-form" | "upload-video" | "processing" | "results" | "complete"

export function AnimatedDemo({ open, onOpenChange, onComplete }: AnimatedDemoProps) {
  const [currentStep, setCurrentStep] = useState<DemoStep>("intro")
  const [progress, setProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState(0)
  const [typingText, setTypingText] = useState("")

  const processingSteps = [
    { text: "Processing your interview...", icon: Video },
    { text: "Analyzing gestures and eye contact...", icon: Eye },
    { text: "Generating feedback...", icon: Brain },
    { text: "Analysis complete!", icon: CheckCircle },
  ]

  const skillsData = [
    { skill: "Communication", score: 85 },
    { skill: "Body Language", score: 78 },
    { skill: "Eye Contact", score: 92 },
    { skill: "Confidence", score: 88 },
    { skill: "Technical Knowledge", score: 82 },
    { skill: "Problem Solving", score: 90 },
  ]

  // Auto-advance through steps
  useEffect(() => {
    if (!open) return

    const stepTimings = {
      intro: 2000,
      "click-dashboard": 3000,
      "signup-form": 4000,
      "upload-video": 3500,
      processing: 4000,
      results: 8000,
      complete: 0,
    }

    const timer = setTimeout(() => {
      const steps: DemoStep[] = [
        "intro",
        "click-dashboard",
        "signup-form",
        "upload-video",
        "processing",
        "results",
        "complete",
      ]
      const currentIndex = steps.indexOf(currentStep)
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1])
      }
    }, stepTimings[currentStep])

    return () => clearTimeout(timer)
  }, [currentStep, open])

  // Typing animation for signup form
  useEffect(() => {
    if (currentStep === "signup-form") {
      const nameText = "John Doe"
      const emailText = "john.doe@email.com"

      // Type name first
      let nameIndex = 0
      const nameTimer = setInterval(() => {
        if (nameIndex <= nameText.length) {
          setTypingText(nameText.slice(0, nameIndex))
          nameIndex++
        } else {
          clearInterval(nameTimer)
          // Then type email after a pause
          setTimeout(() => {
            let emailIndex = 0
            const emailTimer = setInterval(() => {
              if (emailIndex <= emailText.length) {
                setTypingText(nameText + "|" + emailText.slice(0, emailIndex))
                emailIndex++
              } else {
                clearInterval(emailTimer)
                setTypingText(nameText + "|" + emailText)
              }
            }, 100)
          }, 500)
        }
      }, 150)

      return () => clearInterval(nameTimer)
    }
  }, [currentStep])

  // Processing animation
  useEffect(() => {
    if (currentStep === "processing") {
      setProgress(0)
      setProcessingStep(0)

      const totalSteps = processingSteps.length
      const stepDuration = 800

      for (let step = 0; step < totalSteps; step++) {
        setTimeout(() => {
          setProcessingStep(step)
          const stepProgress = ((step + 1) / totalSteps) * 100

          const interval = setInterval(() => {
            setProgress((prev) => {
              const nextProgress = prev + 5
              if (nextProgress >= stepProgress) {
                clearInterval(interval)
                return stepProgress
              }
              return nextProgress
            })
          }, stepDuration / 20)
        }, step * stepDuration)
      }
    }
  }, [currentStep])

  const AnimatedCursor = ({ x, y, clicking = false }: { x: number; y: number; clicking?: boolean }) => (
    <motion.div
      className="absolute z-50 pointer-events-none"
      animate={{ x, y }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <motion.div animate={{ scale: clicking ? 0.8 : 1 }} transition={{ duration: 0.1 }}>
        <MousePointer className="w-6 h-6 text-white drop-shadow-lg" />
      </motion.div>
      {clicking && (
        <motion.div
          className="absolute -top-1 -left-1 w-8 h-8 border-2 border-white rounded-full"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.div>
  )

  const StepTooltip = ({ text, position }: { text: string; position: { x: number; y: number } }) => (
    <motion.div
      className="absolute z-40 pointer-events-none"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600 whitespace-nowrap">
        <p className="text-sm font-medium">{text}</p>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-700"></div>
      </div>
    </motion.div>
  )

  const renderIntro = () => (
    <div className="flex items-center justify-center h-full">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
          <Play className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Interactive Demo</h2>
        <p className="text-gray-300 text-lg">Watch how InterviewAI works in just 30 seconds</p>
        <div className="flex items-center justify-center gap-2 mt-6 text-gray-400">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-400"></div>
        </div>
      </motion.div>
    </div>
  )

  const renderClickDashboard = () => (
    <div className="relative h-full">
      {/* Simulated homepage header */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            InterviewAI
          </div>
          <div className="flex gap-4">
            <motion.div
              className="relative"
              animate={{
                boxShadow: currentStep === "click-dashboard" ? "0 0 20px rgba(156, 163, 175, 0.5)" : "none",
                scale: currentStep === "click-dashboard" ? 1.05 : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              <Button variant="ghost" className="text-white hover:bg-white/10 border border-gray-700/50">
                Dashboard
              </Button>
            </motion.div>
            <Button className="bg-gradient-to-r from-gray-700 to-gray-900 border border-gray-600">Get Started</Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center h-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Evaluate Your Interview Performance
          </h1>
          <p className="text-xl text-gray-300 mb-8">Get instant AI-powered feedback on your interview skills</p>
        </motion.div>
      </div>

      <AnimatedCursor x={200} y={80} clicking={currentStep === "click-dashboard"} />
      <StepTooltip text="Step 1: Click Dashboard" position={{ x: 250, y: 50 }} />
    </div>
  )

  const renderSignupForm = () => {
    const [name, email] = typingText.split("|")

    return (
      <div className="flex items-center justify-center h-full relative">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Create Account</CardTitle>
              <CardDescription className="text-gray-400">Sign up to start analyzing your interviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input className="pl-10 bg-gray-800/50 border-gray-600 text-white" value={name || ""} readOnly />
                    {name && name.length < "John Doe".length && (
                      <motion.div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-white"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input className="pl-10 bg-gray-800/50 border-gray-600 text-white" value={email || ""} readOnly />
                    {email && email.length < "john.doe@email.com".length && (
                      <motion.div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-white"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      />
                    )}
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-gray-700 to-gray-900 border border-gray-600">
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <StepTooltip text="Step 2: Sign Up (Automated)" position={{ x: 100, y: 100 }} />
      </div>
    )
  }

  const renderUploadVideo = () => (
    <div className="flex items-center justify-center h-full relative">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl">
        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Interview Video
            </CardTitle>
            <CardDescription className="text-gray-400">Upload your interview recording for AI analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center relative overflow-hidden"
              animate={{
                borderColor: currentStep === "upload-video" ? "#9CA3AF" : "#4B5563",
                backgroundColor: currentStep === "upload-video" ? "rgba(55, 65, 81, 0.3)" : "transparent",
              }}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-300 text-lg mb-2">Drop your video here</p>
              <p className="text-sm text-gray-500">MP4, MOV up to 100MB</p>

              {/* Animated file drop */}
              <motion.div
                className="absolute top-4 left-1/2 transform -translate-x-1/2"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
              >
                <div className="bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  interview_video.mp4
                </div>
              </motion.div>

              {/* Upload progress simulation */}
              <motion.div
                className="absolute bottom-4 left-4 right-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-gray-500 to-gray-700 h-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, delay: 2 }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Uploading...</p>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatedCursor x={400} y={300} />
      <StepTooltip text="Step 3: Upload Video (Simulated)" position={{ x: 200, y: 150 }} />
    </div>
  )

  const renderProcessing = () => (
    <div className="flex items-center justify-center h-full relative">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-white">AI Analysis in Progress</CardTitle>
            <CardDescription className="text-gray-400">Our AI is analyzing your interview performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              <motion.div className="w-20 h-20 mx-auto bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                {React.createElement(processingSteps[processingStep].icon, {
                  className: "w-10 h-10 text-white",
                })}
              </motion.div>

              <motion.h3
                key={processingStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-xl font-semibold"
              >
                {processingSteps[processingStep].text}
              </motion.h3>

              <div className="space-y-4">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
              </div>

              <div className="flex justify-center space-x-2">
                {processingSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index <= processingStep ? "bg-gray-400" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <StepTooltip text="Step 4: AI Processing" position={{ x: 200, y: 100 }} />
    </div>
  )

  const renderResults = () => (
    <div className="h-full overflow-y-auto p-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Your Interview Analysis</h2>
          <p className="text-gray-400">Comprehensive AI-powered performance insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Award, label: "Overall", score: "85%", status: "Excellent" },
            { icon: Eye, label: "Eye Contact", score: "78%", status: "Good" },
            { icon: Mic, label: "Speech", score: "92%", status: "Outstanding" },
            { icon: Brain, label: "Confidence", score: "88%", status: "Strong" },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-gray-300 flex items-center gap-1">
                    <metric.icon className="w-3 h-3" />
                    {metric.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-1">{metric.score}</div>
                  <div className="flex items-center text-xs text-gray-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {metric.status}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Score Gauges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Performance Breakdown</CardTitle>
              <CardDescription className="text-gray-400">Detailed analysis of your interview skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreGauge title="Communication" score={85} color="gray" />
                <ScoreGauge title="Body Language" score={78} color="gray" />
                <ScoreGauge title="Technical Skills" score={92} color="gray" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills Radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
          <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Skills Analysis
              </CardTitle>
              <CardDescription className="text-gray-400">Comprehensive breakdown of your abilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <RadarChart data={skillsData} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <StepTooltip text="Step 5: View Your Results!" position={{ x: 200, y: 50 }} />
    </div>
  )

  const renderComplete = () => (
    <div className="flex items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white mb-4">Demo Complete!</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            You've seen how InterviewAI analyzes your performance and provides actionable insights. Ready to try it with
            your own interview video?
          </p>
        </div>

        <Button
          onClick={onComplete}
          size="lg"
          className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-lg px-8 py-4 hover:scale-105 transition-all duration-300 border border-gray-600"
        >
          <Target className="w-5 h-5 mr-2" />
          Get Started to Try for Real
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-sm text-gray-500">Sign up now to upload your own videos and get personalized feedback</p>
      </motion.div>
    </div>
  )

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full bg-gray-900 border-gray-700 text-white p-0 overflow-hidden">
            <div className="relative w-full h-full">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Progress indicator */}
              <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
                <Badge className="bg-gray-800/50 text-gray-300 border-gray-700">Animated Demo</Badge>
                <div className="flex space-x-1">
                  {["intro", "click-dashboard", "signup-form", "upload-video", "processing", "results", "complete"].map(
                    (step, index) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          [
                            "intro",
                            "click-dashboard",
                            "signup-form",
                            "upload-video",
                            "processing",
                            "results",
                            "complete",
                          ].indexOf(currentStep) >= index
                            ? "bg-gray-400"
                            : "bg-gray-700"
                        }`}
                      />
                    ),
                  )}
                </div>
              </div>

              {/* Step content */}
              <div className="w-full h-full">
                {currentStep === "intro" && renderIntro()}
                {currentStep === "click-dashboard" && renderClickDashboard()}
                {currentStep === "signup-form" && renderSignupForm()}
                {currentStep === "upload-video" && renderUploadVideo()}
                {currentStep === "processing" && renderProcessing()}
                {currentStep === "results" && renderResults()}
                {currentStep === "complete" && renderComplete()}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

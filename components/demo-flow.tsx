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
} from "lucide-react"
import { ScoreGauge } from "@/components/score-gauge"
import { RadarChart } from "@/components/radar-chart"

interface DemoFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

type DemoStep = "highlight" | "signup" | "upload" | "processing" | "dashboard"

export function DemoFlow({ open, onOpenChange, onComplete }: DemoFlowProps) {
  const [currentStep, setCurrentStep] = useState<DemoStep>("highlight")
  const [progress, setProgress] = useState(0)
  const [processingStep, setProcessingStep] = useState(0)
  const [formData, setFormData] = useState({ name: "", email: "" })

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

  useEffect(() => {
    if (currentStep === "highlight") {
      const timer = setTimeout(() => {
        setCurrentStep("signup")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep("upload")
  }

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentStep("processing")
    setProgress(0)
    setProcessingStep(0)

    // Simulate processing
    const totalSteps = processingSteps.length
    const stepDuration = 750 // ~3 seconds total

    for (let step = 0; step < totalSteps; step++) {
      setTimeout(() => {
        setProcessingStep(step)
        const stepProgress = ((step + 1) / totalSteps) * 100

        const interval = setInterval(() => {
          setProgress((prev) => {
            const nextProgress = prev + 5
            if (nextProgress >= stepProgress) {
              clearInterval(interval)
              if (step === totalSteps - 1) {
                setTimeout(() => setCurrentStep("dashboard"), 500)
              }
              return stepProgress
            }
            return nextProgress
          })
        }, stepDuration / 20)
      }, step * stepDuration)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleGetStarted = () => {
    onOpenChange(false)
    onComplete()
  }

  const renderHighlightStep = () => (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-6 relative">
        {/* Highlight the upload section */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative">
          <Card className="bg-gray-900/90 border-gray-700/50 backdrop-blur-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Interview Video
              </CardTitle>
              <CardDescription className="text-gray-400">Upload a 30-60 second video for AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-300">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-2">MP4, MOV up to 100MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Animated tooltip */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-20 left-1/2 transform -translate-x-1/2"
          >
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-lg shadow-lg border border-gray-600">
              <p className="text-sm font-medium">Let's see how this works! 👆</p>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-700"></div>
            </div>
          </motion.div>

          {/* Pulsing highlight effect */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="absolute inset-0 border-4 border-gray-400 rounded-lg opacity-50"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-8"
        >
          <p className="text-white text-lg mb-4">First, you'll need to sign up to upload your video</p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-400"></div>
          </div>
        </motion.div>
      </div>
    </div>
  )

  const renderSignupStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Quick Demo Signup</h2>
        <p className="text-gray-400">Let's create your account (this is just a demo!)</p>
      </div>

      <form onSubmit={handleSignupSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="demo-name" className="text-gray-300">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="demo-name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="demo-email" className="text-gray-300">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="demo-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-gray-500"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white py-3 transition-all duration-300 border border-gray-600"
        >
          Continue Demo
        </Button>
      </form>

      <div className="text-center">
        <Badge className="bg-gray-800/50 text-gray-300 border-gray-700">Demo Mode - No real account created</Badge>
      </div>
    </div>
  )

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your Interview Video</h2>
        <p className="text-gray-400">Now let's upload a video for analysis</p>
      </div>

      <form onSubmit={handleUploadSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label className="text-gray-300">Interview Video</Label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-gray-500 transition-all duration-300 cursor-pointer hover:bg-gray-800/30">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-300 text-lg mb-2">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">MP4, MOV, AVI up to 100MB</p>
            <p className="text-xs text-gray-600 mt-2">Demo: We'll simulate the upload process</p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white py-3 transition-all duration-300 border border-gray-600"
        >
          <Upload className="w-5 h-5 mr-2" />
          Start Demo Analysis
        </Button>
      </form>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">AI Analysis in Progress</h2>
        <p className="text-gray-400">Our AI is analyzing your interview performance</p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-8 text-center">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center mb-4">
            {React.createElement(processingSteps[processingStep].icon, {
              className: "w-10 h-10 text-white",
            })}
          </div>
        </motion.div>

        <motion.h3
          key={processingStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white text-xl mb-2 font-semibold"
        >
          {processingSteps[processingStep].text}
        </motion.h3>

        <p className="text-gray-400 mb-6">This is what happens when you upload a real video</p>
        <Progress value={progress} className="h-3 mb-4" />
        <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>

        {/* Processing steps indicator */}
        <div className="flex justify-center mt-6 space-x-2">
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
    </div>
  )

  const renderDashboardStep = () => (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Your Demo Results</h2>
        <p className="text-gray-400">Here's what your personal dashboard would look like</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-300 flex items-center gap-1">
              <Award className="w-3 h-3" />
              Overall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">85%</div>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              Excellent
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-300 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Eye Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">78%</div>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              Good
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-300 flex items-center gap-1">
              <Mic className="w-3 h-3" />
              Speech
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">92%</div>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              Outstanding
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-300 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">88%</div>
            <div className="flex items-center text-xs text-gray-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              Strong
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Gauges */}
      <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">Performance Breakdown</CardTitle>
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

      {/* Skills Radar */}
      <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
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

      {/* CTA */}
      <div className="text-center space-y-4 pt-4 border-t border-gray-700">
        <h3 className="text-xl font-bold text-white">Ready to try this for real?</h3>
        <p className="text-gray-400">Sign up now to upload your own videos and get personalized feedback</p>
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-lg px-8 py-4 hover:scale-105 transition-all duration-300 border border-gray-600"
        >
          <Target className="w-5 h-5 mr-2" />
          Get Started to Try for Real
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {currentStep === "highlight" && renderHighlightStep()}
          {currentStep !== "highlight" && (
            <Dialog open={open} onOpenChange={onOpenChange}>
              <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700 text-white">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gray-800/50 text-gray-300 border-gray-700">Interactive Demo</Badge>
                    <div className="flex space-x-1">
                      {["signup", "upload", "processing", "dashboard"].map((step, index) => (
                        <div
                          key={step}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            ["signup", "upload", "processing", "dashboard"].indexOf(currentStep) >= index
                              ? "bg-gray-400"
                              : "bg-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {currentStep === "signup" && renderSignupStep()}
                {currentStep === "upload" && renderUploadStep()}
                {currentStep === "processing" && renderProcessingStep()}
                {currentStep === "dashboard" && renderDashboardStep()}
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

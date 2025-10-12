"use client"

import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Eye, Mic, Zap, Shield, Target, CheckCircle } from "lucide-react"

interface LearnMoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LearnMoreModal({ open, onOpenChange }: LearnMoreModalProps) {
  const features = [
    {
      icon: Brain,
      title: "Advanced AI Analysis",
      description: "Our proprietary AI models analyze over 50 behavioral indicators in real-time.",
      color: "from-gray-600 to-gray-800",
    },
    {
      icon: Eye,
      title: "Computer Vision Technology",
      description: "State-of-the-art computer vision tracks eye movements, facial expressions, and body language.",
      color: "from-gray-700 to-gray-900",
    },
    {
      icon: Mic,
      title: "Speech Pattern Recognition",
      description: "Advanced NLP analyzes speech clarity, pace, filler words, and vocal confidence.",
      color: "from-gray-800 to-black",
    },
  ]

  const benefits = [
    "Instant feedback on interview performance",
    "Personalized improvement recommendations",
    "Practice with industry-specific scenarios",
    "Track progress over time",
    "HR-validated assessment criteria",
    "Secure and private analysis",
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent text-center">
            How Our AI Works
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Hero Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our cutting-edge AI technology combines computer vision, natural language processing, and machine learning
              to provide comprehensive interview performance analysis.
            </p>
          </motion.div>

          {/* Technology Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-all duration-300 h-full backdrop-blur-sm">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* How It Works */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-2xl text-center">The Analysis Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Upload Video", desc: "Upload your interview recording securely" },
                  { step: "2", title: "AI Processing", desc: "Our AI analyzes visual and audio data" },
                  { step: "3", title: "Generate Report", desc: "Comprehensive analysis is generated" },
                  { step: "4", title: "Get Insights", desc: "Receive actionable feedback and tips" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 mx-auto bg-gradient-to-r from-gray-600 to-gray-800 rounded-full flex items-center justify-center mb-4">
                      <span className="text-white font-bold">{item.step}</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}>
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Key Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className="flex items-center gap-3 text-gray-300"
                      >
                        <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        {benefit}
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}>
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-300">
                    Your privacy is our priority. All video uploads are encrypted and processed securely.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• End-to-end encryption</li>
                    <li>• No data sharing with third parties</li>
                    <li>• Automatic deletion after analysis</li>
                    <li>• GDPR compliant</li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="text-center space-y-4"
          >
            <h3 className="text-2xl font-bold text-white">Ready to improve your interview skills?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 hover:scale-105 transition-all duration-300 border border-gray-600"
                onClick={() => onOpenChange(false)}
              >
                Try Demo Now
              </Button>
              <Button
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-700 hover:scale-105 transition-all duration-300 bg-transparent"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ScoreGaugeProps {
  title: string
  score: number
  color: "gray"
}

export function ScoreGauge({ title, score, color }: ScoreGaugeProps) {
  const strokeDasharray = 2 * Math.PI * 45 // circumference
  const strokeDashoffset = strokeDasharray - (strokeDasharray * score) / 100

  return (
    <Card className="bg-gray-800/30 border-gray-700/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-center text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-24 h-24 mb-4">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-700"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#grayGradient)"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              initial={{ strokeDashoffset: strokeDasharray }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{
                strokeDasharray,
              }}
            />
            <defs>
              <linearGradient id="grayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" className="stop-color-gray-400" />
                <stop offset="100%" className="stop-color-gray-600" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="text-2xl font-bold text-white"
            >
              {score}%
            </motion.span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

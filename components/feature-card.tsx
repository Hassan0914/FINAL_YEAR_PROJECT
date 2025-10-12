"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface FeatureCardProps {
  feature: {
    icon: LucideIcon
    title: string
    description: string
    color: string
  }
  index: number
}

export function FeatureCard({ feature, index }: FeatureCardProps) {
  const { icon: Icon, title, description, color } = feature

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ y: -10, scale: 1.05 }}
    >
      <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300 group">
        <CardHeader>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-12 h-12 rounded-lg bg-gradient-to-r ${color} flex items-center justify-center mb-4`}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
          <CardTitle className="text-white group-hover:text-gray-200 transition-colors">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-gray-300 leading-relaxed">{description}</CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  )
}

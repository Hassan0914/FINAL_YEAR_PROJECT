"use client"

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"

interface RadarChartProps {
  data: Array<{
    skill: string
    score: number
  }>
}

export function RadarChart({ data }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadarChart data={data}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
        <Radar name="Score" dataKey="score" stroke="#6B7280" fill="#6B7280" fillOpacity={0.3} strokeWidth={2} />
      </RechartsRadarChart>
    </ResponsiveContainer>
  )
}

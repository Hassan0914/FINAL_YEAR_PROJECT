"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jul", score: 72, interviews: 3 },
  { month: "Aug", score: 76, interviews: 5 },
  { month: "Sep", score: 78, interviews: 4 },
  { month: "Oct", score: 82, interviews: 6 },
  { month: "Nov", score: 85, interviews: 7 },
  { month: "Dec", score: 88, interviews: 8 },
]

export function PerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="month" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#F9FAFB",
          }}
        />
        <Bar dataKey="score" fill="url(#grayGradient)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6B7280" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#374151" stopOpacity={0.8} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}

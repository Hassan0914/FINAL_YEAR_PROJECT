import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const { gestureScores, frameCount, landmarksSummary, voiceConfidence } = await request.json()
    
    // Create new PDF document with landscape orientation for better layout
    const doc = new jsPDF('landscape', 'mm', 'a4')
    
    // Set up colors and fonts
    const primaryColor = [40, 40, 40]
    const secondaryColor = [100, 100, 100]
    const accentColor = [59, 130, 246] // Blue accent
    const successColor = [34, 197, 94] // Green
    const warningColor = [245, 158, 11] // Orange
    
    // Background gradient effect (simulated with rectangles)
    doc.setFillColor(15, 15, 15) // Dark background
    doc.rect(0, 0, 297, 210, 'F')
    
    // Header section with gradient background
    doc.setFillColor(30, 30, 30)
    doc.roundedRect(10, 10, 277, 40, 5, 5, 'F')
    
    // Title with gradient text effect
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('InterviewAI Dashboard Report', 20, 30)
    
    // Subtitle
    doc.setFontSize(12)
    doc.setTextColor(200, 200, 200)
    doc.setFont('helvetica', 'normal')
    doc.text('AI-Powered Gesture Analysis & Performance Analytics', 20, 38)
    
    // Date and time
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 38)
    
    // Key Metrics Section (matching dashboard cards)
    const metricsY = 60
    const cardWidth = 50
    const cardHeight = 25
    const cardSpacing = 10
    
    // Overall Score Card
    doc.setFillColor(45, 45, 45)
    doc.roundedRect(20, metricsY, cardWidth, cardHeight, 3, 3, 'F')
    doc.setDrawColor(100, 100, 100)
    doc.roundedRect(20, metricsY, cardWidth, cardHeight, 3, 3, 'S')
    
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.text('Overall Score', 25, metricsY + 8)
    
    const overallScore = Math.round(Object.values(gestureScores).reduce((sum, score) => sum + score, 0) / 5)
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(`${overallScore}/7`, 25, metricsY + 18)
    
    // Hand Visibility Card
    doc.setFillColor(45, 45, 45)
    doc.roundedRect(80, metricsY, cardWidth, cardHeight, 3, 3, 'F')
    doc.setDrawColor(100, 100, 100)
    doc.roundedRect(80, metricsY, cardWidth, cardHeight, 3, 3, 'S')
    
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.text('Hand Visibility', 85, metricsY + 8)
    
    const handVisibility = Math.max(1, 8 - gestureScores.hidden_hands)
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(`${handVisibility}/7`, 85, metricsY + 18)
    
    // Gesture Usage Card
    doc.setFillColor(45, 45, 45)
    doc.roundedRect(140, metricsY, cardWidth, cardHeight, 3, 3, 'F')
    doc.setDrawColor(100, 100, 100)
    doc.roundedRect(140, metricsY, cardWidth, cardHeight, 3, 3, 'S')
    
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.text('Gesture Usage', 145, metricsY + 8)
    
    const gestureUsage = gestureScores.gestures_on_table
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(`${gestureUsage}/7`, 145, metricsY + 18)
    
    // Analysis Card
    doc.setFillColor(45, 45, 45)
    doc.roundedRect(200, metricsY, cardWidth, cardHeight, 3, 3, 'F')
    doc.setDrawColor(100, 100, 100)
    doc.roundedRect(200, metricsY, cardWidth, cardHeight, 3, 3, 'S')
    
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.text('Frames Processed', 205, metricsY + 8)
    
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(frameCount.toString(), 205, metricsY + 18)
    
    // Gesture Analysis Results Section
    const resultsY = 100
    
    // Section header
    doc.setFillColor(40, 40, 40)
    doc.roundedRect(20, resultsY, 257, 30, 5, 5, 'F')
    
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Gesture Analysis Results', 30, resultsY + 12)
    
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.setFont('helvetica', 'normal')
    doc.text('AI-powered analysis of your interview gestures and body language (1-7 scale)', 30, resultsY + 20)
    
    // Gesture score cards in a row
    const gestureTypes = [
      { key: 'hidden_hands', label: 'Hidden Hands', description: 'Hands not visible' },
      { key: 'hands_on_table', label: 'Hands on Table', description: 'Resting on table' },
      { key: 'gestures_on_table', label: 'Gestures on Table', description: 'Gesturing near table' },
      { key: 'self_touch', label: 'Self Touch', description: 'Touching face/body' }
    ]
    
    const cardY = resultsY + 40
    const gestureCardWidth = 45
    const gestureCardHeight = 35
    const gestureCardSpacing = 5
    
    gestureTypes.forEach((gesture, index) => {
      const score = gestureScores[gesture.key] || 0
      const x = 20 + index * (gestureCardWidth + gestureCardSpacing)
      
      // Draw card background
      doc.setFillColor(45, 45, 45)
      doc.roundedRect(x, cardY, gestureCardWidth, gestureCardHeight, 3, 3, 'F')
      
      // Draw border
      doc.setDrawColor(100, 100, 100)
      doc.roundedRect(x, cardY, gestureCardWidth, gestureCardHeight, 3, 3, 'S')
      
      // Add content
      doc.setFontSize(10)
      doc.setTextColor(200, 200, 200)
      doc.text(gesture.label, x + 5, cardY + 10)
      
      doc.setFontSize(20)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text(`${score}/7`, x + 5, cardY + 22)
      
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(gesture.description, x + 5, cardY + 30)
    })
    
    // Analysis Summary Section
    const summaryY = 150
    
    // Section header
    doc.setFillColor(40, 40, 40)
    doc.roundedRect(20, summaryY, 257, 30, 5, 5, 'F')
    
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Analysis Summary', 30, summaryY + 12)
    
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.setFont('helvetica', 'normal')
    doc.text('Detailed breakdown of your interview performance', 30, summaryY + 20)
    
    // Summary cards
    const summaryCards = [
      { label: 'Total Frames', value: frameCount.toString(), color: [59, 130, 246] },
      { label: 'Left Hand Detected', value: `${landmarksSummary?.left_hand_detected_frames || 0} frames`, color: [34, 197, 94] },
      { label: 'Right Hand Detected', value: `${landmarksSummary?.right_hand_detected_frames || 0} frames`, color: [34, 197, 94] },
      { label: 'Both Hands Detected', value: `${landmarksSummary?.both_hands_detected_frames || 0} frames`, color: [245, 158, 11] }
    ]
    
    const summaryCardY = summaryY + 40
    const summaryCardWidth = 60
    const summaryCardHeight = 25
    
    summaryCards.forEach((card, index) => {
      const x = 20 + index * (summaryCardWidth + 5)
      
      // Draw card background
      doc.setFillColor(45, 45, 45)
      doc.roundedRect(x, summaryCardY, summaryCardWidth, summaryCardHeight, 3, 3, 'F')
      
      // Draw colored border
      doc.setDrawColor(card.color[0], card.color[1], card.color[2])
      doc.roundedRect(x, summaryCardY, summaryCardWidth, summaryCardHeight, 3, 3, 'S')
      
      // Add content
      doc.setFontSize(9)
      doc.setTextColor(200, 200, 200)
      doc.text(card.label, x + 5, summaryCardY + 8)
      
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text(card.value, x + 5, summaryCardY + 18)
    })
    
    // Recommendations Section
    const recommendationsY = summaryCardY + 40
    
    // Section header
    doc.setFillColor(40, 40, 40)
    doc.roundedRect(20, recommendationsY, 257, 30, 5, 5, 'F')
    
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('AI Recommendations', 30, recommendationsY + 12)
    
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 200)
    doc.setFont('helvetica', 'normal')
    doc.text('Personalized suggestions based on your gesture analysis', 30, recommendationsY + 20)
    
    // Generate recommendations
    const recommendations = []
    if (gestureScores.hidden_hands > 3) {
      recommendations.push('🎯 Consider improving camera positioning to capture hands better')
    }
    if (gestureScores.hands_on_table > 3) {
      recommendations.push('💡 Hands frequently on table - consider gesture variety')
    }
    if (gestureScores.gestures_on_table > 3) {
      recommendations.push('✅ Good use of table gestures for emphasis')
    } else {
      recommendations.push('🚀 Try incorporating more varied hand gestures')
    }
    if (gestureScores.self_touch > 3) {
      recommendations.push('⚠️ High self-touch frequency - consider reducing for better presentation')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 Overall gesture patterns look balanced and professional')
    }
    
    // Draw recommendations
    const recY = recommendationsY + 40
    recommendations.forEach((rec, index) => {
      // Draw recommendation card
      doc.setFillColor(50, 50, 50)
      doc.roundedRect(20, recY + (index * 15), 257, 12, 2, 2, 'F')
      
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'normal')
      doc.text(rec, 25, recY + 8 + (index * 15))
    })
    
    // Footer with branding
    const footerY = 190
    doc.setFillColor(20, 20, 20)
    doc.roundedRect(10, footerY, 277, 15, 3, 3, 'F')
    
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('Generated by InterviewAI Dashboard', 20, footerY + 8)
    doc.text(`Report ID: ${Date.now().toString(36).toUpperCase()}`, 200, footerY + 8)
    
    // Convert to buffer
    const pdfBuffer = doc.output('arraybuffer')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="gesture-analysis-report.pdf"',
      },
    })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

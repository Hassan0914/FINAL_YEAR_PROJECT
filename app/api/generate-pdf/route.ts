import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

export async function POST(request: NextRequest) {
  try {
    const { 
      gestureScores, 
      overallScore, 
      frameCount, 
      facialAnalysis, 
      landmarksSummary, 
      voiceConfidence,
      previousOverallScore,
      analysisCount
    } = await request.json()
    
    // Create new PDF document
    const doc = new jsPDF('portrait', 'mm', 'a4')
    
    // Page dimensions
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const contentWidth = pageWidth - (margin * 2)
    
    // Dashboard theme colors (exact match)
    const bgDark = [17, 24, 39] // bg-gray-900
    const cardBg = [31, 41, 55] // bg-gray-900/50
    const borderGray = [75, 85, 99] // border-gray-700/50
    const textPrimary = [255, 255, 255] // text-white
    const textSecondary = [209, 213, 219] // text-gray-300
    const textMuted = [156, 163, 175] // text-gray-400
    const successGreen = [34, 197, 94] // text-green-400
    const dangerRed = [239, 68, 68] // text-red-400
    
    // ============================================
    // PAGE BACKGROUND (matching dashboard gradient)
    // ============================================
    doc.setFillColor(bgDark[0], bgDark[1], bgDark[2])
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    
    // Subtle gradient overlay
    doc.setFillColor(31, 41, 55)
    doc.setGState(doc.GState({ opacity: 0.3 }))
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    doc.setGState(doc.GState({ opacity: 1 }))
    
    let currentY = margin
    
    // ============================================
    // HEADER (matching dashboard)
    // ============================================
    doc.setFontSize(24)
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
    doc.setFont('helvetica', 'bold')
    doc.text('InterviewAI Dashboard Report', margin, currentY)
    
    doc.setFontSize(11)
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2])
    doc.setFont('helvetica', 'normal')
    doc.text('Track your interview performance and identify areas for improvement', margin, currentY + 7)
    
    currentY += 20
    
    // ============================================
    // KEY METRICS (4 cards matching dashboard)
    // ============================================
    const cardWidth = (contentWidth - 18) / 4 // 4 cards with gaps
    const cardHeight = 35
    
    // Card 1: Overall Score
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2])
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 4, 4, 'F')
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 4, 4, 'S')
    
    doc.setFontSize(9)
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2])
    doc.setFont('helvetica', 'normal')
    doc.text('Overall Score', margin + 8, currentY + 8)
    
    doc.setFontSize(18)
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
    doc.setFont('helvetica', 'bold')
    doc.text(overallScore !== null && overallScore !== undefined ? `${overallScore.toFixed(1)}/10` : '—', margin + 8, currentY + 20)
    
    doc.setFontSize(7)
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    doc.setFont('helvetica', 'normal')
    doc.text(overallScore !== null ? 'Latest analysis' : 'No analysis yet', margin + 8, currentY + 28)
    
    // Card 2: Improvement from Last Interview
    const card2X = margin + cardWidth + 6
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2])
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 4, 4, 'F')
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 4, 4, 'S')
    
    doc.setFontSize(9)
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2])
    doc.setFont('helvetica', 'normal')
    doc.text('Improvement from', card2X + 8, currentY + 6)
    doc.text('Last Interview', card2X + 8, currentY + 10)
    
    let improvementText = '—'
    let improvementColor = textPrimary
    if (overallScore !== null && previousOverallScore !== null) {
      const diff = overallScore - previousOverallScore
      improvementText = `${diff > 0 ? '+' : diff < 0 ? '-' : ''}${Math.abs(diff).toFixed(1)}`
      if (diff > 0) improvementColor = successGreen
      else if (diff < 0) improvementColor = dangerRed
    } else if (overallScore !== null) {
      improvementText = 'First analysis'
      improvementColor = textMuted
    }
    
    doc.setFontSize(18)
    doc.setTextColor(improvementColor[0], improvementColor[1], improvementColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text(improvementText, card2X + 8, currentY + 22)
    
    doc.setFontSize(7)
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    doc.setFont('helvetica', 'normal')
    if (overallScore !== null && previousOverallScore !== null) {
      doc.text(overallScore > previousOverallScore ? 'Improved from last' : overallScore < previousOverallScore ? 'Declined from last' : 'Same as last', card2X + 8, currentY + 28)
    } else if (overallScore !== null) {
      doc.text('No previous analysis', card2X + 8, currentY + 28)
    } else {
      doc.text('No analysis yet', card2X + 8, currentY + 28)
    }
    
    // Card 3: Total Interviews
    const card3X = margin + (cardWidth + 6) * 2
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2])
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 4, 4, 'F')
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 4, 4, 'S')
    
    doc.setFontSize(9)
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2])
    doc.setFont('helvetica', 'normal')
    doc.text('Total Interviews', card3X + 8, currentY + 8)
    
    doc.setFontSize(18)
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
    doc.setFont('helvetica', 'bold')
    doc.text((analysisCount || 0).toString(), card3X + 8, currentY + 20)
    
    doc.setFontSize(7)
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    doc.setFont('helvetica', 'normal')
    const interviewText = analysisCount === 0 ? 'No analyses yet' : analysisCount === 1 ? 'Analysis completed' : 'Analyses completed'
    doc.text(interviewText, card3X + 8, currentY + 28)
    
    // Card 4: Analysis (Frames)
    const card4X = margin + (cardWidth + 6) * 3
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2])
    doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 4, 4, 'F')
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(card4X, currentY, cardWidth, cardHeight, 4, 4, 'S')
    
    doc.setFontSize(9)
    doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2])
    doc.setFont('helvetica', 'normal')
    doc.text('Analysis', card4X + 8, currentY + 8)
    
    doc.setFontSize(18)
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
    doc.setFont('helvetica', 'bold')
    doc.text(frameCount?.toString() || '—', card4X + 8, currentY + 20)
    
    doc.setFontSize(7)
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    doc.setFont('helvetica', 'normal')
    doc.text(frameCount ? 'Frames processed' : 'No analysis yet', card4X + 8, currentY + 28)
    
    currentY += cardHeight + 20
    
    // ============================================
    // GESTURE ANALYSIS RESULTS (matching dashboard)
    // ============================================
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2])
    doc.roundedRect(margin, currentY, contentWidth, 50, 4, 4, 'F')
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, currentY, contentWidth, 50, 4, 4, 'S')
    
    // Header
    doc.setFontSize(14)
    doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
    doc.setFont('helvetica', 'bold')
    doc.text('Gesture Analysis Results', margin + 10, currentY + 10)
    
    doc.setFontSize(9)
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    doc.setFont('helvetica', 'normal')
    doc.text('AI-powered analysis of your interview gestures and body language (1-10 scale)', margin + 10, currentY + 16)
    
    // 4 gesture scores in a grid
    const gestureCardWidth = (contentWidth - 30) / 4
    const gestureCardX = margin + 10
    const gestureCardY = currentY + 22
    
    const gestures = [
      { key: 'hidden_hands', label: 'Hidden Hands', desc: 'Hands not visible' },
      { key: 'hands_on_table', label: 'Hands on Table', desc: 'Resting on table' },
      { key: 'gestures_on_table', label: 'Gestures on Table', desc: 'Gesturing near table' },
      { key: 'self_touch', label: 'Self Touch', desc: 'Touching face/body' }
    ]
    
    gestures.forEach((gesture, index) => {
      const x = gestureCardX + index * (gestureCardWidth + 6)
      const score = gestureScores?.[gesture.key] || 0
      
      // Score
      doc.setFontSize(16)
      doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
      doc.setFont('helvetica', 'bold')
      doc.text(`${score.toFixed(2)}/10`, x, gestureCardY + 8, { align: 'center' })
      
      // Label
      doc.setFontSize(9)
      doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2])
      doc.setFont('helvetica', 'normal')
      doc.text(gesture.label, x, gestureCardY + 14, { align: 'center' })
      
      // Description
      doc.setFontSize(7)
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
      doc.setFont('helvetica', 'normal')
      doc.text(gesture.desc, x, gestureCardY + 20, { align: 'center' })
    })
    
    currentY += 50 + 15
    
    // ============================================
    // FACIAL EXPRESSION ANALYSIS (if available)
    // ============================================
    if (facialAnalysis?.smile_score !== null && facialAnalysis?.smile_score !== undefined) {
      doc.setFillColor(cardBg[0], cardBg[1], cardBg[2])
      doc.roundedRect(margin, currentY, contentWidth, 45, 4, 4, 'F')
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, currentY, contentWidth, 45, 4, 4, 'S')
      
      // Header
      doc.setFontSize(14)
      doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
      doc.setFont('helvetica', 'bold')
      doc.text('Facial Expression Analysis', margin + 10, currentY + 10)
      
      doc.setFontSize(9)
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
      doc.setFont('helvetica', 'normal')
      doc.text('AI-powered analysis of your facial expressions and engagement (1-10 scale)', margin + 10, currentY + 16)
      
      // 2 columns
      const facialCardWidth = (contentWidth - 30) / 2
      const facialCardX = margin + 10
      const facialCardY = currentY + 22
      
      // Smile Score
      doc.setFontSize(18)
      doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
      doc.setFont('helvetica', 'bold')
      doc.text(`${facialAnalysis.smile_score.toFixed(2)}/10`, facialCardX, facialCardY + 8, { align: 'center' })
      
      doc.setFontSize(9)
      doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2])
      doc.setFont('helvetica', 'normal')
      doc.text('Smile Score', facialCardX, facialCardY + 14, { align: 'center' })
      
      doc.setFontSize(7)
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
      doc.setFont('helvetica', 'normal')
      doc.text('Engagement level', facialCardX, facialCardY + 20, { align: 'center' })
      
      // Processing Time
      const processingTime = facialAnalysis.processing_time || 0
      doc.setFontSize(18)
      doc.setTextColor(textPrimary[0], textPrimary[1], textPrimary[2])
      doc.setFont('helvetica', 'bold')
      doc.text(`${processingTime.toFixed(2)}s`, facialCardX + facialCardWidth + 6, facialCardY + 8, { align: 'center' })
      
      doc.setFontSize(9)
      doc.setTextColor(textSecondary[0], textSecondary[1], textSecondary[2])
      doc.setFont('helvetica', 'normal')
      doc.text('Processing Time', facialCardX + facialCardWidth + 6, facialCardY + 14, { align: 'center' })
      
      doc.setFontSize(7)
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
      doc.setFont('helvetica', 'normal')
      doc.text('Analysis duration', facialCardX + facialCardWidth + 6, facialCardY + 20, { align: 'center' })
      
      currentY += 45 + 15
    }
    
    // ============================================
    // FOOTER
    // ============================================
    const footerY = pageHeight - 12
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2])
    doc.setLineWidth(0.5)
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3)
    
    doc.setFontSize(8)
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2])
    doc.setFont('helvetica', 'normal')
    doc.text('Generated by InterviewAI Dashboard', margin, footerY)
    doc.text(`Report ID: ${Date.now().toString(36).toUpperCase()}`, pageWidth - margin, footerY, { align: 'right' })
    
    // Convert to buffer
    const pdfBuffer = doc.output('arraybuffer')
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="interview-analysis-report.pdf"',
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

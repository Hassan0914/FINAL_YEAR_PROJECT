import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkLatestAnalysis() {
  try {
    console.log('🔍 Checking latest analysis in database...\n')
    
    // Get the most recent analysis
    const latestAnalysis = await prisma.analysis_history.findFirst({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })
    
    if (!latestAnalysis) {
      console.log('❌ No analysis found in database')
      return
    }
    
    console.log('✅ Latest Analysis Found:\n')
    console.log('=' .repeat(60))
    console.log('📊 Analysis Details:')
    console.log('=' .repeat(60))
    console.log(`ID: ${latestAnalysis.id}`)
    console.log(`Video Name: ${latestAnalysis.videoName}`)
    console.log(`Video File Name: ${latestAnalysis.videoFileName}`)
    console.log(`Created At: ${latestAnalysis.createdAt.toISOString()}`)
    console.log(`Created At (Local): ${latestAnalysis.createdAt.toLocaleString()}`)
    console.log('\n👤 User:')
    console.log(`  ID: ${latestAnalysis.user.id}`)
    console.log(`  Email: ${latestAnalysis.user.email}`)
    console.log(`  Name: ${latestAnalysis.user.name || 'N/A'}`)
    
    console.log('\n' + '=' .repeat(60))
    console.log('📈 Gesture Analysis Scores (1-10 scale):')
    console.log('=' .repeat(60))
    console.log(`Hands on Table:     ${latestAnalysis.handsOnTable !== null ? latestAnalysis.handsOnTable.toFixed(2) : 'null'}/10`)
    console.log(`Hidden Hands:      ${latestAnalysis.hiddenHands !== null ? latestAnalysis.hiddenHands.toFixed(2) : 'null'}/10`)
    console.log(`Gestures on Table: ${latestAnalysis.gestureOnTable !== null ? latestAnalysis.gestureOnTable.toFixed(2) : 'null'}/10`)
    console.log(`Self Touch:        ${latestAnalysis.selfTouch !== null ? latestAnalysis.selfTouch.toFixed(2) : 'null'}/10`)
    console.log(`Final Score:       ${latestAnalysis.finalScore !== null ? latestAnalysis.finalScore.toFixed(2) : 'null'}/10`)
    
    console.log('\n' + '=' .repeat(60))
    console.log('😊 Facial Analysis:')
    console.log('=' .repeat(60))
    console.log(`Smile Score: ${latestAnalysis.smileScore !== null ? latestAnalysis.smileScore.toFixed(2) : 'null'}/10`)
    
    console.log('\n' + '=' .repeat(60))
    console.log('⚙️  Processing Metadata:')
    console.log('=' .repeat(60))
    console.log(`Gesture Frames:  ${latestAnalysis.gestureFrames !== null ? latestAnalysis.gestureFrames : 'null'}`)
    console.log(`Facial Frames:   ${latestAnalysis.facialFrames !== null ? latestAnalysis.facialFrames : 'null'}`)
    console.log(`Processing Time: ${latestAnalysis.processingTime !== null ? latestAnalysis.processingTime.toFixed(2) + 's' : 'null'}`)
    console.log(`Gesture Success: ${latestAnalysis.gestureSuccess ? '✅ Yes' : '❌ No'}`)
    console.log(`Facial Success:  ${latestAnalysis.facialSuccess ? '✅ Yes' : '❌ No'}`)
    
    console.log('\n' + '=' .repeat(60))
    console.log('📋 Raw Database Values (for comparison):')
    console.log('=' .repeat(60))
    console.log(JSON.stringify({
      handsOnTable: latestAnalysis.handsOnTable,
      hiddenHands: latestAnalysis.hiddenHands,
      gestureOnTable: latestAnalysis.gestureOnTable,
      selfTouch: latestAnalysis.selfTouch,
      finalScore: latestAnalysis.finalScore,
      smileScore: latestAnalysis.smileScore,
      gestureFrames: latestAnalysis.gestureFrames,
      facialFrames: latestAnalysis.facialFrames,
      processingTime: latestAnalysis.processingTime,
      gestureSuccess: latestAnalysis.gestureSuccess,
      facialSuccess: latestAnalysis.facialSuccess,
    }, null, 2))
    
    console.log('\n' + '=' .repeat(60))
    console.log('✅ Display complete!')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLatestAnalysis()


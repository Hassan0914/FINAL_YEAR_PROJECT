import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create test users
  const password = await bcrypt.hash('password123', 12)
  
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      password,
      name: 'John Doe',
      isVerified: true,
      verificationCode: null,
      codeExpiresAt: null,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      password,
      name: 'Jane Smith',
      isVerified: true,
      verificationCode: null,
      codeExpiresAt: null,
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password,
      name: 'Demo User',
      isVerified: true,
      verificationCode: null,
      codeExpiresAt: null,
    },
  })

  console.log('✅ Created users:', [user1.email, user2.email, user3.email])

  // Generate dummy analysis history for user1 (John Doe) - Last 6 months
  const analysisData = []
  const now = new Date()
  
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const recordsPerMonth = Math.floor(Math.random() * 3) + 2 // 2-4 records per month
    
    for (let i = 0; i < recordsPerMonth; i++) {
      const dayOfMonth = Math.floor(Math.random() * 28) + 1
      const createdAt = new Date(month.getFullYear(), month.getMonth(), dayOfMonth)
      
      analysisData.push({
        userId: user1.id,
        videoName: `Interview Session ${monthOffset * 10 + i + 1}`,
        videoFileName: `session_${Date.now()}_${i}.mp4`,
        
        // Gesture scores (1-7 scale) - randomized but realistic
        handsOnTable: parseFloat((Math.random() * 3 + 4).toFixed(2)), // 4-7 (good)
        hiddenHands: parseFloat((Math.random() * 3 + 1).toFixed(2)), // 1-4 (low is good)
        gestureOnTable: parseFloat((Math.random() * 2 + 5).toFixed(2)), // 5-7 (good)
        selfTouch: parseFloat((Math.random() * 3 + 2).toFixed(2)), // 2-5 (moderate)
        otherGestures: parseFloat((Math.random() * 2 + 4).toFixed(2)), // 4-6
        
        // Facial analysis
        smileScore: parseFloat((Math.random() * 2 + 5).toFixed(2)), // 5-7 (good)
        
        // Metadata
        gestureFrames: Math.floor(Math.random() * 200) + 150,
        facialFrames: Math.floor(Math.random() * 200) + 150,
        processingTime: parseFloat((Math.random() * 5 + 2).toFixed(2)),
        gestureSuccess: true,
        facialSuccess: true,
        
        createdAt,
      })
    }
  }

  // Insert all analysis records
  for (const data of analysisData) {
    await prisma.analysisHistory.create({ data })
  }

  console.log(`✅ Created ${analysisData.length} analysis records for ${user1.email}`)

  // Generate some data for user2 (Jane Smith) - Last 3 months
  const janeAnalysisData = []
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const recordsPerMonth = Math.floor(Math.random() * 2) + 1 // 1-2 records per month
    
    for (let i = 0; i < recordsPerMonth; i++) {
      const dayOfMonth = Math.floor(Math.random() * 28) + 1
      const createdAt = new Date(month.getFullYear(), month.getMonth(), dayOfMonth)
      
      janeAnalysisData.push({
        userId: user2.id,
        videoName: `Practice Interview ${monthOffset * 5 + i + 1}`,
        videoFileName: `practice_${Date.now()}_${i}.mp4`,
        
        handsOnTable: parseFloat((Math.random() * 2 + 5).toFixed(2)),
        hiddenHands: parseFloat((Math.random() * 2 + 2).toFixed(2)),
        gestureOnTable: parseFloat((Math.random() * 2 + 5).toFixed(2)),
        selfTouch: parseFloat((Math.random() * 2 + 3).toFixed(2)),
        otherGestures: parseFloat((Math.random() * 2 + 4).toFixed(2)),
        smileScore: parseFloat((Math.random() * 2 + 5).toFixed(2)),
        
        gestureFrames: Math.floor(Math.random() * 150) + 100,
        facialFrames: Math.floor(Math.random() * 150) + 100,
        processingTime: parseFloat((Math.random() * 4 + 1).toFixed(2)),
        gestureSuccess: true,
        facialSuccess: true,
        
        createdAt,
      })
    }
  }

  for (const data of janeAnalysisData) {
    await prisma.analysisHistory.create({ data })
  }

  console.log(`✅ Created ${janeAnalysisData.length} analysis records for ${user2.email}`)

  // Create recent analysis for demo user
  await prisma.analysisHistory.create({
    data: {
      userId: user3.id,
      videoName: 'Demo Interview Analysis',
      videoFileName: 'demo_video.mp4',
      handsOnTable: 6.5,
      hiddenHands: 2.0,
      gestureOnTable: 6.8,
      selfTouch: 3.2,
      otherGestures: 5.5,
      smileScore: 6.9,
      gestureFrames: 180,
      facialFrames: 180,
      processingTime: 3.5,
      gestureSuccess: true,
      facialSuccess: true,
      createdAt: new Date(),
    },
  })

  console.log(`✅ Created 1 analysis record for ${user3.email}`)

  console.log('\n🎉 Database seeding completed!')
  console.log('\n📊 Summary:')
  console.log(`   Users created: 3`)
  console.log(`   Total analysis records: ${analysisData.length + janeAnalysisData.length + 1}`)
  console.log('\n👤 Test Credentials:')
  console.log(`   Email: john.doe@example.com | Password: password123`)
  console.log(`   Email: jane.smith@example.com | Password: password123`)
  console.log(`   Email: demo@example.com | Password: password123`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

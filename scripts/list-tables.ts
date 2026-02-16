/**
 * Script to list all tables in the database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listTables() {
  console.log('📊 Database Tables\n')
  console.log('='.repeat(60))

  try {
    // Check users table
    const userCount = await prisma.users.count()
    console.log(`\n✅ Table: users`)
    console.log(`   Records: ${userCount}`)

    // Check analysis_history table
    const analysisCount = await prisma.analysis_history.count()
    console.log(`\n✅ Table: analysis_history`)
    console.log(`   Records: ${analysisCount}`)

    // Show relationship
    console.log(`\n📌 Relationship:`)
    console.log(`   users (1) ──< (many) analysis_history`)
    console.log(`   Each user can have multiple analysis records`)
    console.log(`   Each analysis record belongs to one user`)

    // Show sample data
    if (userCount > 0) {
      const sampleUser = await prisma.users.findFirst({
        select: {
          id: true,
          email: true,
          name: true,
        },
      })
      
      if (sampleUser) {
        const userAnalyses = await prisma.analysis_history.count({
          where: { userId: sampleUser.id },
        })
        console.log(`\n📝 Example:`)
        console.log(`   User: ${sampleUser.name || sampleUser.email}`)
        console.log(`   Has ${userAnalyses} analysis record(s)`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

listTables()
  .then(() => {
    console.log('\n✨ Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })


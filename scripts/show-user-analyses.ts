/**
 * Script to show analysis count for each user
 * Helps identify which users have analyses and which don't
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function showUserAnalyses() {
  console.log('📊 Analysis Count by User\n')
  console.log('=' .repeat(60))

  try {
    // Get all users
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`\nTotal Users: ${allUsers.length}\n`)

    // Show analysis count for each user
    for (const user of allUsers) {
      const analysisCount = await prisma.analysis_history.count({
        where: {
          userId: user.id,
        },
      })

      const analyses = await prisma.analysis_history.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          videoName: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3, // Show first 3
      })

      const status = analysisCount === 0 ? '❌ NO ANALYSES' : `✅ ${analysisCount} analysis(es)`
      
      console.log(`\n👤 ${user.name || 'No name'} (${user.email})`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Status: ${status}`)
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`)
      
      if (analysisCount > 0) {
        console.log(`   Recent analyses:`)
        analyses.forEach((analysis, index) => {
          console.log(`      ${index + 1}. ${analysis.videoName} (${analysis.createdAt.toLocaleDateString()})`)
        })
        if (analysisCount > 3) {
          console.log(`      ... and ${analysisCount - 3} more`)
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    const totalAnalyses = await prisma.analysis_history.count()
    const usersWithAnalyses = await prisma.users.findMany({
      where: {
        analyses: {
          some: {},
        },
      },
    })

    console.log(`\n📈 Summary:`)
    console.log(`   Total users: ${allUsers.length}`)
    console.log(`   Users with analyses: ${usersWithAnalyses.length}`)
    console.log(`   Users without analyses: ${allUsers.length - usersWithAnalyses.length}`)
    console.log(`   Total analysis records: ${totalAnalyses}`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
showUserAnalyses()
  .then(() => {
    console.log('\n✨ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })


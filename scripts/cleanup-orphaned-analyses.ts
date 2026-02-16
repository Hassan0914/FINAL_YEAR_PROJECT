/**
 * Script to find and clean up orphaned analysis_history records
 * Orphaned records are those where userId doesn't match any user in the users table
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupOrphanedAnalyses() {
  console.log('🔍 Checking for orphaned analysis_history records...\n')

  try {
    // Get all unique userIds from analysis_history
    const allAnalyses = await prisma.analysis_history.findMany({
      select: {
        id: true,
        userId: true,
        videoName: true,
        createdAt: true,
      },
    })

    console.log(`📊 Total analysis_history records: ${allAnalyses.length}`)

    // Get all valid user IDs
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
      },
    })

    const validUserIds = new Set(allUsers.map(u => u.id))
    console.log(`👥 Total users: ${allUsers.length}`)
    console.log(`   Users: ${allUsers.map(u => u.email).join(', ')}\n`)

    // Find orphaned records
    const orphanedRecords = allAnalyses.filter(
      analysis => !validUserIds.has(analysis.userId)
    )

    if (orphanedRecords.length === 0) {
      console.log('✅ No orphaned records found! All analysis_history records have valid userIds.')
      return
    }

    console.log(`⚠️  Found ${orphanedRecords.length} orphaned record(s):\n`)
    orphanedRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id}`)
      console.log(`      userId: ${record.userId} (user does not exist)`)
      console.log(`      videoName: ${record.videoName}`)
      console.log(`      createdAt: ${record.createdAt}`)
      console.log('')
    })

    // Delete orphaned records
    console.log('🗑️  Deleting orphaned records...')
    const deleteResult = await prisma.analysis_history.deleteMany({
      where: {
        userId: {
          notIn: Array.from(validUserIds),
        },
      },
    })

    console.log(`✅ Deleted ${deleteResult.count} orphaned record(s)\n`)

    // Verify cleanup
    const remainingAnalyses = await prisma.analysis_history.findMany({
      select: {
        userId: true,
      },
    })

    const remainingOrphaned = remainingAnalyses.filter(
      a => !validUserIds.has(a.userId)
    )

    if (remainingOrphaned.length === 0) {
      console.log('✅ Cleanup complete! All remaining records have valid userIds.')
    } else {
      console.log(`⚠️  Warning: ${remainingOrphaned.length} orphaned records still exist.`)
    }

    // Show statistics by user
    console.log('\n📈 Analysis count by user:')
    for (const user of allUsers) {
      const count = await prisma.analysis_history.count({
        where: {
          userId: user.id,
        },
      })
      console.log(`   ${user.email}: ${count} analysis record(s)`)
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupOrphanedAnalyses()
  .then(() => {
    console.log('\n✨ Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  })


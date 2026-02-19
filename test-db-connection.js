// Quick database connection test
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Try a simple query
    const userCount = await prisma.users.count();
    console.log(`✅ Database is accessible. Current users: ${userCount}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('P1000') || error.message.includes('Authentication failed')) {
      console.error('\n🔧 Fix: Update DATABASE_URL in .env.local with correct password');
      console.error('Format: postgresql://username:password@localhost:5432/database_name');
      console.error('\nCurrent DATABASE_URL uses password: 12345');
      console.error('Please update it to match your PostgreSQL password.');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();














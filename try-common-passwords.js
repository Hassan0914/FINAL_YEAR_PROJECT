// Try common PostgreSQL passwords
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const commonPasswords = [
  'postgres',
  'admin',
  '12345',
  'password',
  'root',
  '',
  '123456',
  'postgresql',
  'admin123'
];

async function tryPassword(password) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://postgres:${password}@localhost:5432/fyp_database`
      }
    }
  });

  try {
    await prisma.$connect();
    console.log(`\n✅ SUCCESS! Password found: "${password}"`);
    console.log(`\nUpdate your .env.local file with:`);
    console.log(`DATABASE_URL="postgresql://postgres:${password}@localhost:5432/fyp_database"`);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  console.log('Trying common PostgreSQL passwords...\n');
  
  for (const password of commonPasswords) {
    const displayPassword = password === '' ? '(empty/blank)' : password;
    process.stdout.write(`Trying: ${displayPassword}... `);
    
    const success = await tryPassword(password);
    if (success) {
      return;
    }
    console.log('❌');
  }
  
  console.log('\n❌ None of the common passwords worked.');
  console.log('\nNext steps:');
  console.log('1. Open pgAdmin 4 (search in Windows Start menu)');
  console.log('2. Connect to your PostgreSQL server');
  console.log('3. Check the Connection tab for the password');
  console.log('4. Or try to remember what password you set during installation');
  console.log('\nAlternatively, you can reset the password using:');
  console.log('  - pgAdmin 4: Right-click server → Properties → Connection tab');
  console.log('  - Or run: reset-postgres.bat');
}

main().catch(console.error);






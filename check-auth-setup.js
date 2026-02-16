// Check authentication setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Authentication Setup...\n');

// 1. Check .env.local
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local exists');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET'
  ];
  
  console.log('\n📋 Environment Variables:');
  requiredVars.forEach(varName => {
    if (envContent.includes(varName + '=')) {
      const match = envContent.match(new RegExp(`${varName}="([^"]+)"`));
      if (match) {
        const value = match[1];
        // Hide sensitive values
        if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
          console.log(`   ✅ ${varName}: ${value.substring(0, 10)}...`);
        } else {
          console.log(`   ✅ ${varName}: ${value}`);
        }
      } else {
        console.log(`   ⚠️  ${varName}: Found but format might be wrong`);
      }
    } else {
      console.log(`   ❌ ${varName}: MISSING`);
    }
  });
} else {
  console.log('❌ .env.local NOT FOUND');
  console.log('   Create it with: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, JWT_SECRET');
}

// 2. Check Prisma client
const prismaClientPath = path.join(__dirname, 'node_modules', '.prisma', 'client', 'index.d.ts');
if (fs.existsSync(prismaClientPath)) {
  console.log('\n✅ Prisma client generated');
} else {
  console.log('\n❌ Prisma client NOT generated');
  console.log('   Run: npx prisma generate');
}

// 3. Check if database models match
try {
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    if (schema.includes('model users')) {
      console.log('\n✅ Prisma schema uses lowercase "users" model');
    } else {
      console.log('\n⚠️  Prisma schema might not use lowercase "users"');
    }
  }
} catch (e) {
  console.log('\n⚠️  Could not check Prisma schema');
}

console.log('\n📝 Next Steps:');
console.log('1. Ensure .env.local has all required variables');
console.log('2. Run: npx prisma generate');
console.log('3. Restart frontend server: npm run dev');
console.log('4. Try logging in again');


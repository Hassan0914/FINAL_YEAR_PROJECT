// Test email configuration
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.EMAIL_PORT || 587);
const smtpSecure = String(process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true';

console.log('Testing email configuration...\n');
console.log('Email:', process.env.EMAIL_USER);
console.log('Host:', smtpHost);
console.log('Port:', smtpPort);
console.log('Secure:', smtpSecure);
console.log('Password configured:', !!process.env.EMAIL_PASS);
console.log('Password length:', process.env.EMAIL_PASS?.length || 0);
console.log('');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('❌ Email credentials not configured');
  console.log('Add EMAIL_USER and EMAIL_PASS to .env.local');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testEmail() {
  try {
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    console.log('✅ Email configuration is working');
    console.log('\nYou can now receive verification emails!');
  } catch (error) {
    console.log('❌ SMTP connection failed!');
    console.log('Error:', error.message);
    console.log('\nPossible issues:');
    console.log('1. EMAIL_PASS is not a Gmail App Password');
    console.log('2. 2-Step Verification not enabled on Gmail');
    console.log('3. App Password expired or revoked');
    console.log('\nFix: Generate new App Password at:');
    console.log('   https://myaccount.google.com/apppasswords');
  }
}

testEmail();


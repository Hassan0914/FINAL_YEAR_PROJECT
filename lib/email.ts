import nodemailer from 'nodemailer'

// Allow configuring SMTP via env so any provider (Mailtrap, Gmail, Outlook, etc.) can be used
const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com'
const smtpPort = Number(process.env.EMAIL_PORT || 587)
const smtpSecure = String(process.env.EMAIL_SECURE || 'false').toLowerCase() === 'true'

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  } : undefined,
})

export async function sendVerificationEmail(email: string, code: string) {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      // Development mode - just log the code
      console.log('📧 DEVELOPMENT MODE - Email would be sent to:', email)
      console.log('🔐 Verification Code:', code)
      console.log('⏰ Code expires in 10 minutes')
      return { success: true }
    }

    // Production mode - send actual email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - FYP Project',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 20px;">
          <div style="background: #2a2a2a; padding: 30px; border-radius: 10px; border: 1px solid #333;">
            <h2 style="color: #4f46e5; text-align: center; margin-bottom: 30px;">Email Verification</h2>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Thank you for signing up! Please use the following code to verify your email address:</p>
            <div style="background: #1a1a1a; padding: 25px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px solid #4f46e5;">
              <h1 style="color: #4f46e5; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${code}</h1>
            </div>
            <p style="font-size: 14px; color: #a0a0a0; text-align: center; margin-bottom: 20px;">This code will expire in 10 minutes.</p>
            <p style="font-size: 14px; color: #a0a0a0; text-align: center;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return { success: false, error: 'Failed to send verification email' }
  }
}





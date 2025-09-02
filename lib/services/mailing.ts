import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.SMTP_TLS_ENABLED !== 'false'
  }
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_ENABLED || process.env.SMTP_ENABLED !== 'true') {
    console.log('Email sending is disabled');
    return;
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('SMTP credentials not configured');
    return;
  }

  try {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;
    const fromName = process.env.EMAIL_FROM_NAME || 'Experiential Learning Portal';
    
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html,
      replyTo: process.env.EMAIL_REPLY_TO,
    });
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email to:', to, error);
    throw error;
  }
}

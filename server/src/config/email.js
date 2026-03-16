// =============================================
// Email Configuration — Nodemailer + DummyInbox.com
// =============================================
// HOW IT WORKS:
// We send emails TO @dummyinbox.com addresses.
// View received emails at: https://dummyinbox.com/mail/<username>
// Example: owner1@dummyinbox.com → https://dummyinbox.com/mail/owner1
//
// No passwords needed — just visit the URL to see emails!
//
// SENDING METHOD:
// If SMTP credentials are provided in .env → uses that SMTP server
// Otherwise → uses Nodemailer's "direct" transport which sends
// directly to dummyinbox.com's mail server (no relay needed)
//
// In production, set EMAIL_HOST/USER/PASS to a real SMTP provider
// =============================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Build transporter based on available config
let transporter;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
  // SMTP relay mode (Gmail, SendGrid, Ethereal, etc.)
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else {
  // Direct transport — sends to destination MX server without a relay
  // Perfect for development with dummyinbox.com
  transporter = nodemailer.createTransport({
    direct: true,
  });
}

/**
 * Send an email notification
 * @param {Object} options
 * @param {string} options.to - Recipient email (e.g. owner1@dummyinbox.com)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} Nodemailer send result
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const fromAddr = process.env.EMAIL_USER || 'noreply@movemate.app';

    const info = await transporter.sendMail({
      from: `"MoveMate" <${fromAddr}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    console.log(`   View at: https://dummyinbox.com/mail/${to.split('@')[0]}`);
    return info;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    // Don't throw — email failure shouldn't break the main operation
    return null;
  }
};

/**
 * Verify the email transport is working
 */
export const verifyEmailTransport = async () => {
  try {
    if (process.env.EMAIL_HOST) {
      await transporter.verify();
      console.log('📧 Email transport verified (SMTP)');
    } else {
      console.log('📧 Email transport: direct mode (dummyinbox.com)');
      console.log('   View emails at: https://dummyinbox.com/mail/<username>');
    }
  } catch (error) {
    console.warn('⚠️  Email transport not available:', error.message);
  }
};

export default transporter;

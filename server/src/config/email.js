// =============================================
// Email Configuration — Nodemailer + Ethereal Email
// =============================================
// WHY Ethereal?
// During development, you don't want to send real emails.
// Ethereal is a fake SMTP service that CAPTURES emails
// so you can view them in a web interface, but they're
// never actually delivered to anyone.
//
// In production, just change these env vars to a real
// SMTP provider (Gmail, SendGrid, Resend, etc.)
//
// View captured emails: https://ethereal.email/login
// =============================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email notification
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} Nodemailer send result
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"MoveMate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    // For Ethereal, you can view the email at this URL:
    console.log(`   Preview: ${nodemailer.getTestMessageUrl(info)}`);
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
    await transporter.verify();
    console.log('📧 Email transport verified (Ethereal)');
  } catch (error) {
    console.warn('⚠️  Email transport not available:', error.message);
  }
};

export default transporter;

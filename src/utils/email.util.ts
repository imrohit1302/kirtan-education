import nodemailer, { Transporter } from 'nodemailer';
import { envConfig } from '../config/env.config.js';
import { logger } from '../config/logger.config.js';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!transporter && envConfig.SMTP_EMAIL && envConfig.SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: envConfig.SMTP_PORT,
      secure: envConfig.SMTP_SECURE,
      auth: {
        user: envConfig.SMTP_EMAIL,
        pass: envConfig.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
};

export interface SendOtpEmailOptions {
  to: string;
  fullName: string;
  otp: string;
  reason: 'account_verify' | 'password_reset' | string;
}

/**
 * Send an OTP Email to the user
 */
export const sendOtpEmail = async (options: SendOtpEmailOptions): Promise<boolean> => {
  try {
    const mailer = getTransporter();

    if (!mailer) {
      logger.warn('SMTP transporter not initialized. Email skipped; OTP available in payload.');
      return false;
    }

    const isPasswordReset = options.reason === 'password_reset';
    const subject = isPasswordReset
      ? 'Kirtan Education - Password Reset Verification Code'
      : 'Kirtan Education - Verify Your Account';

    const actionText = isPasswordReset
      ? 'use the verification code below to reset your password'
      : 'use the verification code below to activate your account';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          .header { background: #1a365d; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
          .body { padding: 32px 24px; color: #2d3748; line-height: 1.6; }
          .otp-box { background: #edf2f7; border: 2px dashed #cbd5e0; border-radius: 8px; text-align: center; padding: 18px; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2b6cb0; font-family: 'Courier New', Courier, monospace; }
          .footer { background: #f7fafc; padding: 16px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Kirtan Education</h1>
          </div>
          <div class="body">
            <p>Hello <strong>${options.fullName || 'User'}</strong>,</p>
            <p>Please ${actionText}:</p>
            <div class="otp-box">
              <div class="otp-code">${options.otp}</div>
            </div>
            <p>This verification code is strictly confidential and valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
            <p>If you did not request this code, please safely ignore this message.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Kirtan Education. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailer.sendMail({
      from: `"Kirtan Education" <${envConfig.SMTP_FROM}>`,
      to: options.to,
      subject,
      text: `Hello ${options.fullName},\n\nYour Kirtan Education verification code is: ${options.otp}\nValid for 10 minutes.\n\nThank you!`,
      html,
    });

    logger.info(`OTP Email successfully sent to ${options.to}: MessageId: ${info.messageId}`);
    return true;
  } catch (err: any) {
    logger.warn(`Failed to send OTP email to ${options.to}:`, { error: err.message });
    // Non-blocking: we return false and allow the user flow to continue
    return false;
  }
};

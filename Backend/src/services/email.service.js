import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  getTransporter() {
    if (this.transporter) return this.transporter;
    
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port) || 587,
        secure: Number(port) === 465,
        auth: { user, pass },
      });
    }
    return this.transporter;
  }

  async sendVerificationEmail(email, name, token) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174';
    const verificationUrl = `${clientUrl}/verify-email?token=${token}`;

    const subject = 'Verify your email - MoneyTrace AI';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">Welcome to MoneyTrace AI</h2>
        <p style="color: #475569; font-size: 14px;">Understand where your money comes from and where it goes.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p>Hello ${name},</p>
        <p>Thank you for registering. Please click the button below to verify your email address and activate your MoneyTrace AI account:</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:</p>
        <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This verification link will expire in 24 hours. If you did not create an account, please ignore this email.</p>
      </div>
    `;

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] Verification link for ${email}:`);
    console.log(`URL: ${verificationUrl}`);
    console.log(`======================================================\n`);

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"MoneyTrace AI" <${process.env.EMAIL_USER || 'no-reply@moneytrace.ai'}>`,
          to: email,
          subject,
          html,
        });
      } catch (err) {
        console.warn(`[EmailService] Failed to send real email: ${err.message}. Link logged above.`);
      }
    }

    return { verificationUrl };
  }

  async sendPasswordResetEmail(email, name, token) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    const subject = 'Password Reset Request - MoneyTrace AI';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-bottom: 8px;">MoneyTrace AI Security</h2>
        <p style="color: #475569; font-size: 14px;">Password Reset Request</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p>Hello ${name},</p>
        <p>You requested a password reset. Please click the button below to choose a new password:</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:</p>
        <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This reset link is valid for 1 hour. If you did not make this request, you can safely ignore this email.</p>
      </div>
    `;

    console.log(`\n======================================================`);
    console.log(`[EMAIL DISPATCH] Password reset link for ${email}:`);
    console.log(`URL: ${resetUrl}`);
    console.log(`======================================================\n`);

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"MoneyTrace AI Security" <${process.env.EMAIL_USER || 'security@moneytrace.ai'}>`,
          to: email,
          subject,
          html,
        });
      } catch (err) {
        console.warn(`[EmailService] Failed to send real reset email: ${err.message}. Link logged above.`);
      }
    }

    return { resetUrl };
  }
}

export const emailService = new EmailService();

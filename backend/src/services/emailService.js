const nodemailer = require('nodemailer');
const config = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    // If SMTP user is provided, use configured production/staging SMTP
    if (config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      console.log(`Email Service configured with SMTP host: ${config.smtp.host}`);
    } else {
      // In development or when SMTP is not configured, create an Ethereal test account or logging transporter
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[Email Service] Created ethereal development mailbox: ${testAccount.user}`);
      } catch (err) {
        console.warn('[Email Service] Ethereal fallback unavailable, using direct console logger:', err.message);
        this.transporter = {
          sendMail: async (options) => {
            console.log('\n=================== TRANSACTIONAL EMAIL ===================');
            console.log(`TO: ${options.to}`);
            console.log(`SUBJECT: ${options.subject}`);
            console.log(`PREVIEW:\n${options.text || options.html}`);
            console.log('===========================================================\n');
            return { messageId: 'simulated-' + Date.now() };
          },
        };
      }
    }
  }

  async sendMail(mailOptions) {
    if (!this.transporter) {
      await this.initTransporter();
    }

    const options = {
      from: config.smtp.from,
      ...mailOptions,
    };

    try {
      const info = await this.transporter.sendMail(options);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email Service] Message sent! Preview at: ${previewUrl}`);
      }
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
      };
    } catch (error) {
      console.error('[Email Service] Failed to send email:', error.message);
      // Don't crash auth flow in dev if external network fails, return details
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 1. Send Mandatory Account Verification Email with 6-digit OTP & Link
   */
  async sendVerificationEmail({ to, name, otp, token }) {
    const verifyUrl = `${config.frontendUrl}/verify-email?email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`;
    
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">school<span style="color: #0f172a;">connect</span></h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Enterprise Multi-Tenant School SaaS</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Verify your email address</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>${name || 'Educator'}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Welcome to Smart School Connect. Please enter the 6-digit verification code below to verify your account and activate your dashboard access:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 14px 32px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8;">
              ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">This code will expire in 15 minutes.</p>
          </div>

          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Or click the button below to verify automatically in your browser:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">Verify Email Address</a>
          </div>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">If you did not create an account on Smart School Connect, you can safely disregard this email.</p>
      </div>
    `;

    return await this.sendMail({
      to,
      subject: `[${otp}] Verify your Smart School Connect Account`,
      html,
      text: `Hello ${name},\n\nYour Smart School Connect verification code is: ${otp}\n\nOr verify directly at: ${verifyUrl}\n\nThis code expires in 15 minutes.`,
    });
  }

  /**
   * 2. Send Invitation Email for School Onboarding
   */
  async sendInvitationEmail({ to, name, role, schoolName, token, invitedByName }) {
    const inviteUrl = `${config.frontendUrl}/onboard?token=${encodeURIComponent(token)}`;
    const roleTitle = role === 'school_admin' ? 'School Administrator' : role.charAt(0).toUpperCase() + role.slice(1);

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 26px; font-weight: 800; margin: 0;">school<span style="color: #0f172a;">connect</span></h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">School Invitation & Onboarding</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">You have been invited to join ${schoolName}!</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>${name || 'there'}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">${invitedByName || 'The School Administrator'} has invited you to join <strong>${schoolName}</strong> on Smart School Connect as a <strong>${roleTitle}</strong>.</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Click the button below to set up your password and access your dedicated ${roleTitle} portal:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Accept Invitation & Onboard</a>
          </div>
          <p style="color: #64748b; font-size: 12px; word-break: break-all;">Link: ${inviteUrl}</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">This invitation link is valid for 7 days.</p>
      </div>
    `;

    return await this.sendMail({
      to,
      subject: `Invitation: Join ${schoolName} on Smart School Connect as ${roleTitle}`,
      html,
      text: `Hello ${name},\n\nYou have been invited to join ${schoolName} as a ${roleTitle}.\n\nComplete your onboarding here:\n${inviteUrl}`,
    });
  }

  /**
   * 3. Send Password Reset Email ("Forgot Password")
   */
  async sendPasswordResetEmail({ to, name, token }) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 26px; font-weight: 800; margin: 0;">school<span style="color: #0f172a;">connect</span></h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Password Reset Request</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Reset your account password</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>${name || 'User'}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">We received a request to reset the password for your Smart School Connect account.</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Click the button below to choose a new password:</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This reset link will expire in 1 hour.</p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">If you did not request a password reset, no changes have been made.</p>
      </div>
    `;

    return await this.sendMail({
      to,
      subject: 'Reset your Smart School Connect Password',
      html,
      text: `Hello ${name},\n\nPlease use the following link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    });
  }

  /**
   * 4. Real-time Attendance Alert Email
   */
  async sendAttendanceAlertEmail({ to, parentName, studentName, date, status, remarks }) {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 26px; font-weight: 800; margin: 0;">school<span style="color: #0f172a;">connect</span></h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Daily Attendance Notification</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Attendance Alert: ${studentName}</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>${parentName || 'Parent'}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">This is an automated notification regarding your child's attendance for today, <strong>${date}</strong>.</p>
          <div style="padding: 16px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 15px;">Status: ${status.toUpperCase()}</p>
            ${remarks ? `<p style="margin: 4px 0 0; color: #7f1d1d; font-size: 13px;">Remarks: ${remarks}</p>` : ''}
          </div>
          <p style="color: #64748b; font-size: 13px;">You can view the real-time class log on your Parent Portal.</p>
        </div>
      </div>
    `;

    return await this.sendMail({
      to,
      subject: `Attendance Notice: ${studentName} marked ${status} on ${date}`,
      html,
      text: `Dear ${parentName},\n\nYour child ${studentName} was marked ${status} on ${date}.\n${remarks ? `Remarks: ${remarks}\n` : ''}`,
    });
  }
}

module.exports = new EmailService();

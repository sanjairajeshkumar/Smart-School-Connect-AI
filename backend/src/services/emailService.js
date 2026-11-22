const nodemailer = require('nodemailer');
const config = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  async initTransporter() {
    // If SMTP user is provided, use configured production/staging SMTP with strict timeouts
    if (config.smtp.user && config.smtp.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
        connectionTimeout: 3500,
        greetingTimeout: 3500,
        socketTimeout: 3500,
      });
      console.log(`Email Service configured with SMTP host: ${config.smtp.host}`);
    } else {
      // In development or when SMTP is not configured, create a fast console logging transporter
      this.transporter = {
        sendMail: async (options) => {
          console.log('\n=================== TRANSACTIONAL EMAIL (LOCAL LOG) ===================');
          console.log(`TO: ${options.to}`);
          console.log(`SUBJECT: ${options.subject}`);
          console.log(`CONTENT:\n${options.text || options.html}`);
          console.log('========================================================================\n');
          return { messageId: 'simulated-' + Date.now() };
        },
      };
    }
  }

  async sendMail(mailOptions) {
    // 1. If Brevo HTTPS API Key is provided (Sends to ANY recipient on port 443 with 0 restrictions)
    if (config.brevoApiKey) {
      try {
        console.log(`[Email Service] Dispatching via Brevo HTTPS API to ${mailOptions.to}...`);
        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'sanjaiug21@gmail.com';
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': config.brevoApiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'Smart School Connect', email: senderEmail },
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
            textContent: mailOptions.text,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log(`[Email Service] Successfully sent via Brevo API! Message ID: ${data.messageId}`);
          return { success: true, messageId: data.messageId };
        } else {
          console.warn('[Email Service] Brevo API response error:', data);
        }
      } catch (brevoError) {
        console.warn('[Email Service] Brevo dispatch failed:', brevoError.message);
      }
    }

    // 2. If Resend HTTPS API Key is provided
    if (config.resendApiKey) {
      try {
        console.log(`[Email Service] Dispatching via Resend HTTPS API to ${mailOptions.to}...`);
        const sender = config.smtp.from && !config.smtp.from.includes('gmail.com')
          ? config.smtp.from
          : 'Smart School Connect <onboarding@resend.dev>';

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: sender,
            to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
            subject: mailOptions.subject,
            html: mailOptions.html,
            text: mailOptions.text,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log(`[Email Service] Successfully sent via Resend API! Message ID: ${data.id}`);
          return { success: true, messageId: data.id };
        } else {
          console.warn('[Email Service] Resend API response error:', data);
        }
      } catch (resendError) {
        console.warn('[Email Service] Resend dispatch failed:', resendError.message);
      }
    }

    // 3. Fallback to Nodemailer SMTP (with strict timeout to prevent Render free-tier hangs)
    if (!this.transporter) {
      await this.initTransporter();
    }

    const options = {
      from: config.smtp.from,
      ...mailOptions,
    };

    try {
      const sendPromise = this.transporter.sendMail(options);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout: Port 465/587 blocked by cloud host')), 3500)
      );

      const info = await Promise.race([sendPromise, timeoutPromise]);
      const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
      if (previewUrl) {
        console.log(`[Email Service] Message sent! Preview at: ${previewUrl}`);
      }
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
      };
    } catch (error) {
      console.warn(`[Email Service] SMTP dispatch warning for ${mailOptions.to}:`, error.message);
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

  /**
   * 5. Send Homework Grade & Review Email (to Parent and Student)
   */
  async sendGradeReviewEmail({ to, recipientName, studentName, taskTitle, subject, score, maxScore, feedback, teacherName, attachmentUrl }) {
    const isImage = attachmentUrl && (attachmentUrl.startsWith('data:image') || attachmentUrl.startsWith('http'));
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 26px; font-weight: 800; margin: 0;">school<span style="color: #0f172a;">connect</span></h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Homework Grade & Teacher Review Report</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">Assignment Review: ${taskTitle}</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Dear <strong>${recipientName || 'Parent'}</strong>,</p>
          <p style="color: #334155; font-size: 14px; line-height: 1.6;">
            The homework submission for <strong>${studentName}</strong> in <strong>${subject || 'Curriculum'}</strong> has been reviewed and graded by <strong>${teacherName || 'Class Teacher'}</strong>.
          </p>

          <div style="padding: 18px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #065f46; font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Grade Awarded</p>
            <p style="margin: 4px 0 0; color: #047857; font-size: 28px; font-weight: 800;">
              ${score} <span style="font-size: 16px; font-weight: normal; color: #065f46;">/ ${maxScore || 100} points</span>
            </p>
            ${feedback ? `
              <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #a7f3d0;">
                <p style="margin: 0; color: #065f46; font-size: 12px; font-weight: bold;">Teacher Feedback / Review Remarks:</p>
                <p style="margin: 4px 0 0; color: #064e3b; font-size: 14px; font-style: italic;">"${feedback}"</p>
              </div>
            ` : ''}
          </div>

          ${isImage ? `
            <div style="margin-top: 16px; padding: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; font-weight: 600;">Student's Submitted Work Photo:</p>
              <img src="${attachmentUrl}" alt="Student Homework Submission" style="max-width: 100%; max-height: 350px; border-radius: 8px; border: 1px solid #cbd5e1; object-fit: contain;" />
            </div>
          ` : ''}

          <p style="color: #64748b; font-size: 13px; margin-top: 16px;">
            You can view complete submission details, study minutes, and historical performance inside the SchoolConnect portal.
          </p>
        </div>
      </div>
    `;

    return await this.sendMail({
      to,
      subject: `Grade & Review: ${studentName} scored ${score}/${maxScore} on ${taskTitle}`,
      html,
      text: `Hello ${recipientName},\n\n${studentName}'s assignment "${taskTitle}" (${subject}) has been graded by ${teacherName}.\nScore: ${score}/${maxScore}\nTeacher Feedback: ${feedback || 'None'}\n`,
    });
  }
}

module.exports = new EmailService();

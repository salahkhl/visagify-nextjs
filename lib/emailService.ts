import { Resend } from 'resend';

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static instance: EmailService;
  private resend: Resend;
  
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Email confirmation template with dark theme and Stack Sans Notch
  private getConfirmationEmailTemplate(email: string, confirmationUrl: string): EmailTemplate {
    return {
      to: email,
      subject: 'Welcome to Visagify - Confirm your email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Visagify</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Bodoni Moda', -apple-system, BlinkMacSystemFont, serif; 
              background-color: #000000; 
              color: #ffffff; 
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #000000;
            }
            .header { 
              padding: 60px 40px 40px 40px; 
              text-align: center; 
              border-bottom: 1px solid #1a1a1a;
            }
            .logo { 
              color: #ffffff; 
              font-size: 36px; 
              font-weight: 600; 
              margin: 0; 
              letter-spacing: -0.02em;
              font-family: 'Stack Sans Notch', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .tagline {
              color: #888888;
              font-size: 16px;
              font-weight: 300;
              margin-top: 8px;
              letter-spacing: 0.01em;
            }
            .content { 
              padding: 50px 40px; 
            }
            .title {
              color: #ffffff;
              font-size: 24px;
              font-weight: 500;
              margin-bottom: 30px;
              letter-spacing: -0.01em;
              font-family: 'Stack Sans Notch', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .text {
              color: #cccccc;
              font-size: 16px;
              font-weight: 300;
              line-height: 1.7;
              margin-bottom: 25px;
            }
            .button-container {
              text-align: center;
              margin: 40px 0;
            }
            .button { 
              display: inline-block; 
              background-color: #6849b6; 
              color: #ffffff; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: 500;
              font-size: 16px;
              letter-spacing: -0.01em;
              transition: all 0.2s ease;
            }
            .button:hover {
              background-color: #866dc5;
            }
            .link-fallback {
              color: #888888;
              font-size: 14px;
              font-weight: 300;
              margin-top: 30px;
              padding: 20px;
              background-color: #0a0a0a;
              border-radius: 6px;
              border: 1px solid #1a1a1a;
            }
            .link-fallback a {
              color: #a492d3;
              word-break: break-all;
              text-decoration: underline;
            }
            .footer { 
              padding: 40px; 
              text-align: center; 
              border-top: 1px solid #1a1a1a;
            }
            .footer-text {
              color: #666666;
              font-size: 14px;
              font-weight: 300;
              margin-bottom: 8px;
            }
            .security-note {
              color: #888888;
              font-size: 14px;
              font-weight: 300;
              margin-top: 25px;
              padding: 15px;
              background-color: #0a0a0a;
              border-radius: 6px;
              border-left: 3px solid #333333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">Visagify</h1>
              <p class="tagline">AI-Powered Face Swapping</p>
            </div>
            
            <div class="content">
              <h2 class="title">Welcome to Visagify</h2>
              
              <p class="text">
                Thank you for joining Visagify. We're excited to have you explore our AI-powered face swapping technology.
              </p>
              
              <p class="text">
                To activate your account and get started, please confirm your email address by clicking the button below:
              </p>
              
              <div class="button-container">
                <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
              </div>
              
              <div class="link-fallback">
                <p style="margin-bottom: 10px;">If the button doesn't work, copy and paste this link:</p>
                <a href="${confirmationUrl}">${confirmationUrl}</a>
              </div>
              
              <div class="security-note">
                <p>This confirmation link will expire in 24 hours for security reasons.</p>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">© 2024 Visagify. All rights reserved.</p>
              <p class="footer-text">If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Password reset template with dark theme and Stack Sans Notch
  private getPasswordResetTemplate(email: string, resetUrl: string): EmailTemplate {
    return {
      to: email,
      subject: 'Reset your Visagify password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password - Visagify</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Bodoni Moda', -apple-system, BlinkMacSystemFont, serif; 
              background-color: #000000; 
              color: #ffffff; 
              line-height: 1.6;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #000000;
            }
            .header { 
              padding: 60px 40px 40px 40px; 
              text-align: center; 
              border-bottom: 1px solid #1a1a1a;
            }
            .logo { 
              color: #ffffff; 
              font-size: 36px; 
              font-weight: 600; 
              margin: 0; 
              letter-spacing: -0.02em;
              font-family: 'Stack Sans Notch', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .tagline {
              color: #888888;
              font-size: 16px;
              font-weight: 300;
              margin-top: 8px;
              letter-spacing: 0.01em;
            }
            .content { 
              padding: 50px 40px; 
            }
            .title {
              color: #ffffff;
              font-size: 24px;
              font-weight: 500;
              margin-bottom: 30px;
              letter-spacing: -0.01em;
              font-family: 'Stack Sans Notch', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .text {
              color: #cccccc;
              font-size: 16px;
              font-weight: 300;
              line-height: 1.7;
              margin-bottom: 25px;
            }
            .button-container {
              text-align: center;
              margin: 40px 0;
            }
            .button { 
              display: inline-block; 
              background-color: #6849b6; 
              color: #ffffff; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: 500;
              font-size: 16px;
              letter-spacing: -0.01em;
              transition: all 0.2s ease;
            }
            .button:hover {
              background-color: #866dc5;
            }
            .link-fallback {
              color: #888888;
              font-size: 14px;
              font-weight: 300;
              margin-top: 30px;
              padding: 20px;
              background-color: #0a0a0a;
              border-radius: 6px;
              border: 1px solid #1a1a1a;
            }
            .link-fallback a {
              color: #a492d3;
              word-break: break-all;
              text-decoration: underline;
            }
            .footer { 
              padding: 40px; 
              text-align: center; 
              border-top: 1px solid #1a1a1a;
            }
            .footer-text {
              color: #666666;
              font-size: 14px;
              font-weight: 300;
              margin-bottom: 8px;
            }
            .security-note {
              color: #888888;
              font-size: 14px;
              font-weight: 300;
              margin-top: 25px;
              padding: 15px;
              background-color: #0a0a0a;
              border-radius: 6px;
              border-left: 3px solid #ff6b6b;
            }
            .warning-note {
              color: #ffcc00;
              font-size: 14px;
              font-weight: 400;
              margin-top: 25px;
              padding: 15px;
              background-color: #1a1a00;
              border-radius: 6px;
              border-left: 3px solid #ffcc00;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">Visagify</h1>
              <p class="tagline">Password Reset Request</p>
            </div>
            
            <div class="content">
              <h2 class="title">Reset Your Password</h2>
              
              <p class="text">
                We received a request to reset the password for your Visagify account.
              </p>
              
              <p class="text">
                Click the button below to create a new password:
              </p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="link-fallback">
                <p style="margin-bottom: 10px;">If the button doesn't work, copy and paste this link:</p>
                <a href="${resetUrl}">${resetUrl}</a>
              </div>
              
              <div class="security-note">
                <p>This reset link will expire in 1 hour for security reasons.</p>
              </div>
              
              <div class="warning-note">
                <p><strong>Important:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">© 2024 Visagify. All rights reserved.</p>
              <p class="footer-text">This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Send confirmation email
  async sendConfirmationEmail(email: string, confirmationUrl: string): Promise<boolean> {
    try {
      const template = this.getConfirmationEmailTemplate(email, confirmationUrl);
      
      const { data, error } = await this.resend.emails.send({
        from: process.env.NODE_ENV === 'production' 
          ? 'Visagify <noreply@visagify.com>' 
          : 'Visagify <onboarding@resend.dev>',
        to: template.to,
        subject: template.subject,
        html: template.html,
      });

      if (error) {
        console.error('Resend error:', error);
        return false;
      }

      console.log('Confirmation email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
    try {
      const template = this.getPasswordResetTemplate(email, resetUrl);
      
      const { data, error } = await this.resend.emails.send({
        from: process.env.NODE_ENV === 'production' 
          ? 'Visagify <noreply@visagify.com>' 
          : 'Visagify <onboarding@resend.dev>',
        to: template.to,
        subject: template.subject,
        html: template.html,
      });

      if (error) {
        console.error('Resend error:', error);
        return false;
      }

      console.log('Password reset email sent successfully:', data?.id);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }
}

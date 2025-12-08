import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { EmailService } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Generate a secure token for email confirmation
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store the token in database (you'll need to create this table)
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('email_confirmations')
        .insert({
          email,
          token,
          expires_at: expiresAt.toISOString(),
          type: 'signup'
        });

      if (error) {
        console.error('Error storing confirmation token:', error);
        return NextResponse.json(
          { error: 'Failed to create confirmation token' },
          { status: 500 }
        );
      }
    }

    // Create confirmation URL
    const confirmationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/confirm-email?token=${token}`;

    // Send custom email
    const emailService = EmailService.getInstance();
    const emailSent = await emailService.sendConfirmationEmail(email, confirmationUrl);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send confirmation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Confirmation email sent successfully'
    });

  } catch (error) {
    console.error('Error in send-confirmation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



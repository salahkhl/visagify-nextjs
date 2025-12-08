import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 500 }
      );
    }

    // Find the token in database
    const { data: confirmation, error: fetchError } = await supabaseAdmin
      .from('email_confirmations')
      .select('*')
      .eq('token', token)
      .eq('type', 'signup')
      .is('used_at', null)
      .single();

    if (fetchError || !confirmation) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(confirmation.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 400 }
      );
    }

    // Mark token as used
    const { error: updateError } = await supabaseAdmin
      .from('email_confirmations')
      .update({ used_at: now.toISOString() })
      .eq('token', token);

    if (updateError) {
      console.error('Error marking token as used:', updateError);
      return NextResponse.json(
        { error: 'Failed to process confirmation' },
        { status: 500 }
      );
    }

    // For now, we'll just mark the token as used
    // The user confirmation will be handled by the client-side logic

    return NextResponse.json({
      message: 'Email confirmed successfully',
      email: confirmation.email
    });

  } catch (error) {
    console.error('Error in confirm-email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

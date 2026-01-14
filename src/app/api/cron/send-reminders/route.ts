import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPaymentReminder } from '@/lib/email/resend';
import { format } from 'date-fns';

// Helper to get Supabase client (created at runtime, not build time)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// This endpoint should be called by Vercel Cron
// Configure in vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/send-reminders",
//     "schedule": "0 9 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify cron secret is configured
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || cronSecret.length < 32) {
      console.error('[Cron] CRON_SECRET not properly configured');
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Cron] Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providedSecret = authHeader.substring(7); // Remove "Bearer "

    if (providedSecret !== cronSecret) {
      console.error('[Cron] Invalid cron secret provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Additional verification: Check Vercel cron header if present
    const cronHeader = request.headers.get('x-vercel-cron');
    if (!cronHeader) {
      console.warn('[Cron] Request missing x-vercel-cron header - may be manual trigger');
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    console.log(`[Cron] Checking for reminders on ${today}`);

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Fetch all reminders due today that haven't been sent
    const { data: reminders, error } = await supabase
      .from('payment_reminders')
      .select('*')
      .eq('reminder_date', today)
      .eq('email_sent', false);

    if (error) {
      console.error('[Cron] Error fetching reminders:', error);
      throw error;
    }

    if (!reminders || reminders.length === 0) {
      console.log('[Cron] No reminders to send today');
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        count: 0,
      });
    }

    console.log(`[Cron] Found ${reminders.length} reminders to send`);

    // Send emails for each reminder
    const results = [];
    for (const reminder of reminders) {
      try {
        // Get user email
        // In production, you'd fetch the user's email from the auth.users table
        const email = reminder.email || 'user@example.com';

        // Send the email
        await sendPaymentReminder({
          to: email,
          cardName: reminder.card_name || 'Your Credit Card',
          amount: reminder.amount,
          paymentDate: format(new Date(reminder.payment_date), 'MMMM d, yyyy'),
          paymentPurpose: reminder.payment_purpose,
          description: reminder.description || '',
        });

        // Mark as sent
        await supabase
          .from('payment_reminders')
          .update({ email_sent: true })
          .eq('id', reminder.id);

        results.push({ id: reminder.id, status: 'sent' });
        console.log(`[Cron] Sent reminder ${reminder.id}`);
      } catch (emailError) {
        console.error(`[Cron] Failed to send reminder ${reminder.id}:`, emailError);
        // Don't include error details in results (could be exposed in logs)
        results.push({ id: reminder.id, status: 'failed' });
      }
    }

    const successCount = results.filter((r) => r.status === 'sent').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    console.log(`[Cron] Completed: ${successCount} sent, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} reminder(s)`,
      total: reminders.length,
      sent: successCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    // SECURITY: Log full error server-side, but don't expose details to client
    console.error('[Cron] Error in send-reminders:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send reminders. Please check server logs.',
        // Never include error details in production responses
      },
      { status: 500 }
    );
  }
}

// For development/testing - allows POST requests
export async function POST(request: NextRequest) {
  console.log('[Cron] Manual trigger of send-reminders');
  return GET(request);
}

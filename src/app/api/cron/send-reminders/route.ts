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
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        results.push({ id: reminder.id, status: 'failed', error: String(emailError) });
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
    console.error('[Cron] Error in send-reminders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send reminders',
        details: String(error),
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

import { NextRequest, NextResponse } from 'next/server';
// import { createClient } from '@supabase/supabase-js';
import { addDays, format, subDays } from 'date-fns';

// Initialize Supabase client with service role key for server-side operations
// Will be needed when database integration is complete
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, cardIds, daysBefore } = body;

    // Validation
    if (!email || !cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: 'Email and card IDs are required' },
        { status: 400 }
      );
    }

    if (!daysBefore || daysBefore < 1 || daysBefore > 14) {
      return NextResponse.json(
        { error: 'Days before must be between 1 and 14' },
        { status: 400 }
      );
    }

    // For MVP: Since we don't have real auth yet, we'll use email as identifier
    // In production, you'd get the user ID from the session

    // Fetch cards and calculate payment plans
    const remindersToCreate = [];
    const scheduledDates = [];

    for (const cardId of cardIds) {
      // In a real implementation, you'd fetch the card from the database
      // For now, we'll create placeholder data
      // This assumes the card data is passed in the request or retrieved from session storage

      // Create reminders for optimization and balance payments
      // This is a simplified version - in production, you'd calculate exact dates
      const today = new Date();
      const paymentDate1 = addDays(today, 7); // Example: 7 days from now
      const paymentDate2 = addDays(today, 21); // Example: 21 days from now

      const reminderDate1 = subDays(paymentDate1, daysBefore);
      const reminderDate2 = subDays(paymentDate2, daysBefore);

      remindersToCreate.push({
        card_id: cardId,
        email: email,
        payment_date: format(paymentDate1, 'yyyy-MM-dd'),
        amount: 0, // Would be calculated from actual card data
        payment_purpose: 'optimization',
        reminder_date: format(reminderDate1, 'yyyy-MM-dd'),
        email_sent: false,
      });

      remindersToCreate.push({
        card_id: cardId,
        email: email,
        payment_date: format(paymentDate2, 'yyyy-MM-dd'),
        amount: 0, // Would be calculated from actual card data
        payment_purpose: 'balance',
        reminder_date: format(reminderDate2, 'yyyy-MM-dd'),
        email_sent: false,
      });

      scheduledDates.push(
        `${format(reminderDate1, 'MMM d')} - Optimization payment`,
        `${format(reminderDate2, 'MMM d')} - Balance payment`
      );
    }

    // Store reminders in database
    // Note: This is a simplified version for MVP
    // In production, you'd have proper user authentication and store in payment_reminders table

    // For now, we'll just return success with the scheduled dates
    // The actual database insertion would happen here:
    // const { data, error } = await supabase
    //   .from('payment_reminders')
    //   .insert(remindersToCreate);

    // Store reminder preference
    // const { error: prefError } = await supabase
    //   .from('reminder_preferences')
    //   .upsert({
    //     user_id: userId,
    //     days_before_payment: daysBefore,
    //     send_tips_emails: sendTips,
    //   });

    // For MVP, return success response
    return NextResponse.json({
      success: true,
      message: 'Reminders set successfully',
      scheduledDates,
      email,
    });
  } catch (error) {
    console.error('Error creating reminders:', error);
    return NextResponse.json(
      { error: 'Failed to create reminders' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user's reminders
    // In production, you'd get the user ID from the session
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Fetch reminders from database
    // const { data, error } = await supabase
    //   .from('payment_reminders')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('email_sent', false)
    //   .order('reminder_date', { ascending: true });

    // For MVP, return empty array
    return NextResponse.json({
      reminders: [],
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reminderId = searchParams.get('id');

    if (!reminderId) {
      return NextResponse.json(
        { error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    // Delete reminder from database
    // const { error } = await supabase
    //   .from('payment_reminders')
    //   .delete()
    //   .eq('id', reminderId)
    //   .eq('user_id', userId); // Ensure user can only delete their own

    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}

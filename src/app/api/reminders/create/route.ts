import { NextRequest, NextResponse } from 'next/server';
import { subDays, format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, cardPlans, daysBefore, sendTips } = body;

    // Validation
    if (!email || !cardPlans || !Array.isArray(cardPlans) || cardPlans.length === 0) {
      return NextResponse.json(
        { error: 'Email and card plans are required' },
        { status: 400 }
      );
    }

    if (!daysBefore || daysBefore < 1 || daysBefore > 14) {
      return NextResponse.json(
        { error: 'Days before must be between 1 and 14' },
        { status: 400 }
      );
    }

    // Process each card plan and create reminder schedule
    const scheduledDates: string[] = [];
    const reminders: any[] = [];

    for (const plan of cardPlans) {
      if (!plan.payments || plan.payments.length === 0) continue;

      // Create a reminder for each payment
      for (const payment of plan.payments) {
        const paymentDate = new Date(payment.date);
        const reminderDate = subDays(paymentDate, daysBefore);
        const today = new Date();

        // Only create reminders for future dates
        if (reminderDate > today) {
          const reminder = {
            cardName: plan.card.nickname,
            paymentDate: format(paymentDate, 'yyyy-MM-dd'),
            paymentDateFormatted: format(paymentDate, 'MMMM d, yyyy'),
            reminderDate: format(reminderDate, 'yyyy-MM-dd'),
            reminderDateFormatted: format(reminderDate, 'MMMM d, yyyy'),
            amount: payment.amount,
            purpose: payment.purpose,
            description: payment.description,
            email: email,
          };

          reminders.push(reminder);
          scheduledDates.push(
            `${format(reminderDate, 'MMM d')} - ${plan.card.nickname} (${payment.purpose})`
          );
        }
      }
    }

    if (reminders.length === 0) {
      return NextResponse.json(
        { error: 'No future payments found to set reminders for' },
        { status: 400 }
      );
    }

    // In a real implementation, store these in the database
    // For MVP, we'll store them in localStorage on the client side
    // and use a cron job to check and send emails

    // TODO: Store in Supabase database when auth is connected
    // const { data, error } = await supabase
    //   .from('payment_reminders')
    //   .insert(reminders.map(r => ({
    //     user_id: userId,
    //     card_id: r.cardId,
    //     payment_date: r.paymentDate,
    //     amount: r.amount,
    //     payment_purpose: r.purpose,
    //     reminder_date: r.reminderDate,
    //     email_sent: false,
    //   })));

    // TODO: Store reminder preferences
    // await supabase
    //   .from('reminder_preferences')
    //   .upsert({
    //     user_id: userId,
    //     days_before_payment: daysBefore,
    //     send_tips_emails: sendTips,
    //   });

    return NextResponse.json({
      success: true,
      message: `${reminders.length} reminder${reminders.length > 1 ? 's' : ''} scheduled`,
      scheduledDates,
      reminders,
      email,
      preferences: {
        daysBefore,
        sendTips,
      },
    });
  } catch (error) {
    console.error('Error creating reminders:', error);
    return NextResponse.json(
      { error: 'Failed to create reminders' },
      { status: 500 }
    );
  }
}

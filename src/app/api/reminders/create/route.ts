import { NextRequest, NextResponse } from 'next/server';
import { subDays, format } from 'date-fns';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';

// Zod validation schema for input sanitization and injection prevention
const ReminderRequestSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  cardPlans: z.array(
    z.object({
      card: z.object({
        nickname: z.string().min(1).max(100, 'Card nickname too long'),
      }),
      payments: z.array(
        z.object({
          date: z.string(), // ISO date string from frontend
          amount: z.number().positive('Amount must be positive').max(999999, 'Amount too large'),
          purpose: z.enum(['optimization', 'balance'], {
            message: 'Invalid payment purpose',
          }),
          description: z.string().max(500, 'Description too long'),
        })
      ),
    })
  ).min(1, 'At least one card plan required').max(20, 'Too many cards'),
  daysBefore: z.number().int('Days must be an integer').min(1).max(14, 'Days before must be between 1 and 14'),
  sendTips: z.boolean(),
});

interface ReminderData {
  cardName: string;
  paymentDate: string;
  paymentDateFormatted: string;
  reminderDate: string;
  reminderDateFormatted: string;
  amount: number;
  purpose: string;
  description: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Reminders Create] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to create reminders.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate and sanitize input using Zod
    const validationResult = ReminderRequestSchema.safeParse(body);

    if (!validationResult.success) {
      // SECURITY: Log validation errors server-side only
      console.error('[Reminders Create] Validation failed:', validationResult.error.issues);

      return NextResponse.json(
        {
          error: 'Invalid request data. Please check your input and try again.',
          // Don't expose schema structure to clients
        },
        { status: 400 }
      );
    }

    const { email, cardPlans, daysBefore, sendTips } = validationResult.data;

    // Verify the email belongs to the authenticated user
    if (email !== user.email) {
      console.error('[Reminders Create] Email mismatch - user:', user.email, 'requested:', email);
      return NextResponse.json(
        { error: 'You can only create reminders for your own email address.' },
        { status: 403 }
      );
    }

    // Process each card plan and create reminder schedule
    const scheduledDates: string[] = [];
    const reminders: ReminderData[] = [];

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

    // Store reminders in Supabase database
    const { data: savedReminders, error: reminderError } = await supabase
      .from('payment_reminders')
      .insert(reminders.map(r => ({
        user_id: user.id,
        card_id: null, // We don't have card_id from the form, it's optional
        card_name: r.cardName,
        email: r.email,
        payment_date: r.paymentDate,
        amount: r.amount,
        payment_purpose: r.purpose,
        description: r.description,
        reminder_date: r.reminderDate,
        email_sent: false,
      })))
      .select();

    if (reminderError) {
      console.error('[Reminders Create] Database error:', reminderError);
      return NextResponse.json(
        { error: 'Failed to save reminders to database' },
        { status: 500 }
      );
    }

    // Store reminder preferences
    const { error: prefError } = await supabase
      .from('reminder_preferences')
      .upsert({
        user_id: user.id,
        days_before_payment: daysBefore,
        send_tips_emails: sendTips,
      });

    if (prefError) {
      console.error('[Reminders Create] Preferences error:', prefError);
      // Don't fail the request if preferences fail, reminders are still saved
    }

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

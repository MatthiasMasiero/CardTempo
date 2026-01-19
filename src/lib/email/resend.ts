import { Resend } from 'resend';

// Lazy-initialize Resend client (only when API key is available)
let resend: Resend | null = null;
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured. Email functionality is disabled.');
  }
  return resend;
}

// Default sender email - Update this to your verified domain
// For development: Use 'onboarding@resend.dev' (no domain verification needed)
// For production: Use your verified domain (e.g., 'CardTempo <reminders@cardtempo.com>')
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'CardTempo <onboarding@resend.dev>';

interface SendPaymentReminderParams {
  to: string;
  cardName: string;
  amount: number;
  paymentDate: string;
  paymentPurpose: 'optimization' | 'balance';
  description: string;
}

export async function sendPaymentReminder({
  to,
  cardName,
  amount,
  paymentDate,
  paymentPurpose,
  description,
}: SendPaymentReminderParams) {
  try {
    const subject =
      paymentPurpose === 'optimization'
        ? `🎯 Credit Score Optimization Reminder - ${cardName}`
        : `💳 Balance Payment Reminder - ${cardName}`;

    const html = generatePaymentReminderHTML({
      cardName,
      amount,
      paymentDate,
      paymentPurpose,
      description,
    });

    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send payment reminder:', error);
    throw error;
  }
}

interface SendWelcomeEmailParams {
  to: string;
  reminderCount: number;
}

export async function sendWelcomeEmail({ to, reminderCount }: SendWelcomeEmailParams) {
  try {
    const html = generateWelcomeEmailHTML({ reminderCount });

    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '✅ Your Payment Reminders Are Set!',
      html,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

interface SendMonthlyTipsParams {
  to: string;
  tips: string[];
}

export async function sendMonthlyTips({ to, tips }: SendMonthlyTipsParams) {
  try {
    const html = generateMonthlyTipsHTML({ tips });

    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '💡 Monthly Credit Optimization Tips',
      html,
    });

    if (error) {
      console.error('Error sending monthly tips:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send monthly tips:', error);
    throw error;
  }
}

// HTML Email Templates

function generatePaymentReminderHTML({
  cardName,
  amount,
  paymentDate,
  paymentPurpose,
  description,
}: Omit<SendPaymentReminderParams, 'to'>) {
  const isPurposeOptimization = paymentPurpose === 'optimization';
  const color = isPurposeOptimization ? '#3b82f6' : '#10b981';
  const emoji = isPurposeOptimization ? '🎯' : '💳';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">
              ${emoji} Payment Reminder
            </h1>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
              Hi there! 👋
            </p>
            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
              This is your friendly reminder to ${isPurposeOptimization ? 'optimize your credit score' : 'pay your remaining balance'}!
            </p>

            <!-- Card Details -->
            <div style="background: #f1f5f9; padding: 24px; border-radius: 8px; margin-bottom: 30px;">
              <div style="margin-bottom: 16px;">
                <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Card</div>
                <div style="color: #1e293b; font-size: 18px; font-weight: 600;">${cardName}</div>
              </div>
              <div style="margin-bottom: 16px;">
                <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Amount to Pay</div>
                <div style="color: ${color}; font-size: 28px; font-weight: 700;">$${amount.toFixed(2)}</div>
              </div>
              <div>
                <div style="color: #64748b; font-size: 14px; margin-bottom: 4px;">Payment Date</div>
                <div style="color: #1e293b; font-size: 18px; font-weight: 600;">${paymentDate}</div>
              </div>
            </div>

            <!-- Why This Matters -->
            <div style="background: ${isPurposeOptimization ? '#eff6ff' : '#f0fdf4'}; border-left: 4px solid ${color}; padding: 20px; margin-bottom: 30px;">
              <h3 style="color: #1e293b; font-size: 16px; font-weight: 600; margin: 0 0 12px;">
                Why this timing matters:
              </h3>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0;">
                ${description}
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Full Payment Plan
              </a>
            </div>

            <!-- Tips -->
            ${isPurposeOptimization ? `
              <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 24px;">
                <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                  💡 <strong>Pro Tip:</strong> Making this payment now will lower your reported utilization to around 5%, which could boost your credit score by 15-50 points!
                </p>
              </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 30px 20px; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0 0 8px;">
              You're receiving this because you set up payment reminders at CardTempo
            </p>
            <p style="margin: 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings" style="color: #667eea; text-decoration: none;">Manage Reminders</a> •
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/unsubscribe" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateWelcomeEmailHTML({ reminderCount }: { reminderCount: number }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reminders Set!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 600; margin: 0 0 16px;">
              Your Reminders Are Set!
            </h1>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              We've scheduled ${reminderCount} payment reminder${reminderCount > 1 ? 's' : ''} to help you optimize your credit score.
            </p>
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                📧 You'll receive email notifications before each payment date.<br>
                🎯 Each reminder will include the exact amount and timing to maximize your score.
              </p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 20px;">
              Go to Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateMonthlyTipsHTML({ tips }: { tips: string[] }) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Monthly Credit Tips</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 600; margin: 0 0 24px;">
              💡 This Month's Credit Tips
            </h1>
            ${tips.map((tip, i) => `
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="color: #3b82f6; font-size: 18px; font-weight: 600; margin: 0 0 12px;">
                  Tip #${i + 1}
                </h3>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
                  ${tip}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      </body>
    </html>
  `;
}

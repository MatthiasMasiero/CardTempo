import { Resend } from 'resend';

/**
 * Lazy initialize Resend client to avoid build-time errors
 * Only creates the instance when actually needed
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Admin Alert] RESEND_API_KEY not configured - email alerts disabled');
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send admin notification about critical webhook failures
 * This helps you catch issues immediately instead of waiting for users to complain
 */
export async function sendWebhookFailureAlert({
  eventType,
  userId,
  error,
  eventId,
}: {
  eventType: string;
  userId?: string;
  error: string;
  eventId: string;
}) {
  // Only send in production to avoid spam during development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Admin Alert] Skipping in development:', { eventType, userId, error });
    return;
  }

  // Get Resend client (returns null if API key not configured)
  const resend = getResendClient();
  if (!resend) {
    console.log('[Admin Alert] Email alerts disabled - RESEND_API_KEY not configured');
    return;
  }

  // Configure your admin email here
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

  try {
    await resend.emails.send({
      from: 'CardTempo Alerts <alerts@cardtempo.com>',
      to: ADMIN_EMAIL,
      subject: `🚨 Webhook Failure: ${eventType}`,
      html: `
        <h2>Stripe Webhook Failed</h2>
        <p>A critical webhook event failed to process. Immediate action may be required.</p>

        <h3>Details:</h3>
        <ul>
          <li><strong>Event Type:</strong> ${eventType}</li>
          <li><strong>Event ID:</strong> ${eventId}</li>
          <li><strong>User ID:</strong> ${userId || 'Not available'}</li>
          <li><strong>Error:</strong> ${error}</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
        </ul>

        <h3>Action Required:</h3>
        <ol>
          <li>Check Supabase logs for full error details</li>
          <li>Verify user subscription status in database</li>
          <li>If payment succeeded, manually grant access</li>
          <li>Retry webhook from Stripe dashboard if needed</li>
        </ol>

        <p>
          <a href="https://dashboard.stripe.com/webhooks" style="background: #635BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View in Stripe Dashboard
          </a>
        </p>

        <p>
          <a href="https://supabase.com/dashboard/project/bpkervmpqebhvnadqvsz/logs" style="background: #3ECF8E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-left: 10px;">
            View Supabase Logs
          </a>
        </p>
      `,
    });

    console.log('[Admin Alert] Webhook failure notification sent for event:', eventId);
  } catch (emailError) {
    // Don't fail the webhook if email fails - just log it
    console.error('[Admin Alert] Failed to send notification email:', emailError);
  }
}

/**
 * Send notification when a user signs up but subscription creation fails
 */
export async function sendSubscriptionCreationFailureAlert({
  userId,
  email,
  error,
}: {
  userId: string;
  email: string;
  error: string;
}) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Admin Alert] Skipping in development:', { userId, email, error });
    return;
  }

  // Get Resend client (returns null if API key not configured)
  const resend = getResendClient();
  if (!resend) {
    console.log('[Admin Alert] Email alerts disabled - RESEND_API_KEY not configured');
    return;
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'your-email@example.com';

  try {
    await resend.emails.send({
      from: 'CardTempo Alerts <alerts@cardtempo.com>',
      to: ADMIN_EMAIL,
      subject: '⚠️ Subscription Creation Failed for New User',
      html: `
        <h2>New User Signup - Subscription Record Failed</h2>
        <p>A new user signed up but their subscription record failed to create.</p>

        <h3>Details:</h3>
        <ul>
          <li><strong>User ID:</strong> ${userId}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Error:</strong> ${error}</li>
          <li><strong>Time:</strong> ${new Date().toISOString()}</li>
        </ul>

        <h3>Action Required:</h3>
        <ol>
          <li>Manually create subscription record in Supabase</li>
          <li>Run: <code>INSERT INTO subscriptions (user_id, tier, status) VALUES ('${userId}', 'free', 'active')</code></li>
          <li>Investigate why trigger failed</li>
        </ol>
      `,
    });

    console.log('[Admin Alert] Subscription creation failure notification sent for user:', userId);
  } catch (emailError) {
    console.error('[Admin Alert] Failed to send notification email:', emailError);
  }
}

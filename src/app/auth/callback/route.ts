import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  // Use NEXT_PUBLIC_APP_URL for reliable redirects in production
  // Falls back to request origin for local development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  if (token_hash && type) {
    const cookieStore = await cookies();

    // Create Supabase client with cookie handling for session persistence
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Verify the OTP - this also creates a session and sets cookies
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email',
      token_hash,
    });

    if (!error) {
      // Session is now set in cookies
      // If this was a signup confirmation, create user record if it doesn't exist
      if (type === 'signup' && data.user) {
        // Check if user record exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        // Create user record if it doesn't exist (in case trigger didn't fire)
        if (!existingUser) {
          await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email,
            target_utilization: 0.05,
            reminder_days_before: 3,
            email_notifications: true,
          });
        }
      }

      // Add a URL parameter to indicate fresh auth from email confirmation
      const redirectUrl = new URL(next, baseUrl);
      redirectUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // Verification failed
    console.error('[Auth Callback] Verification error:', error.message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Email verification failed. Please try again.')}`, baseUrl)
    );
  }

  // Missing parameters
  return NextResponse.redirect(new URL('/', baseUrl));
}

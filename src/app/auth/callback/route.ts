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
    const { error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'email',
      token_hash,
    });

    if (!error) {
      // Session is now set in cookies - redirect to dashboard
      return NextResponse.redirect(new URL(next, baseUrl));
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

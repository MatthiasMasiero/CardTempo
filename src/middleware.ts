import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { createServerClient } from '@supabase/ssr';

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per IP

// Initialize Upstash Redis rate limiter (production) or in-memory fallback (development)
let ratelimiter: Ratelimit | null = null;

// Try to initialize Upstash Redis if credentials are available
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, `${RATE_LIMIT_WINDOW} s`),
      analytics: true,
      prefix: 'ratelimit',
    });
  } catch (error) {
    console.error('Failed to initialize Upstash rate limiter:', error);
  }
}

// Fallback in-memory rate limiter for development (NOT for production serverless!)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes (only used if Redis not available)
if (!ratelimiter) {
  console.warn('⚠️  Using in-memory rate limiting - NOT suitable for production!');
  console.warn('⚠️  Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.');

  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

async function rateLimitCheck(ip: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // Use Upstash Redis if available (production)
  if (ratelimiter) {
    try {
      const { success, limit, remaining, reset } = await ratelimiter.limit(ip);
      return {
        success,
        limit,
        remaining,
        reset: reset * 1000, // Convert to milliseconds
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if rate limiter fails
      return {
        success: true,
        limit: RATE_LIMIT_MAX_REQUESTS,
        remaining: RATE_LIMIT_MAX_REQUESTS,
        reset: Date.now() + RATE_LIMIT_WINDOW * 1000,
      };
    }
  }

  // Fallback to in-memory rate limiting (development only)
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // New window
    const resetTime = now + RATE_LIMIT_WINDOW * 1000;
    rateLimitMap.set(ip, {
      count: 1,
      resetTime,
    });
    return {
      success: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      reset: resetTime,
    };
  }

  // Existing window
  record.count++;

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      success: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  return {
    success: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: RATE_LIMIT_MAX_REQUESTS - record.count,
    reset: record.resetTime,
  };
}

export async function middleware(request: NextRequest) {
  // Create a response that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Skip Supabase auth for webhook/cron routes (they don't use user sessions)
  const isWebhook = request.nextUrl.pathname.startsWith('/api/webhooks/') ||
                    request.nextUrl.pathname.startsWith('/api/cron/');

  // Refresh Supabase session (keeps auth cookies fresh) - but not for webhooks
  if (!isWebhook && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // This refreshes the session if expired and updates cookies
    await supabase.auth.getUser();
  }

  // Get client IP address
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';

  // Apply rate limiting to API routes (except webhooks/cron)
  if (request.nextUrl.pathname.startsWith('/api/') && !isWebhook) {
    const rateLimitResult = await rateLimitCheck(ip);

    // Add rate limit headers to all API responses
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            ...Object.fromEntries(headers),
          },
        }
      );
    }

    // Continue with rate limit headers (use existing response with Supabase cookies)
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    // Add security headers to API routes
    addSecurityHeaders(response);

    return response;
  }

  // Add security headers to all other routes (use existing response with Supabase cookies)
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (CSP)
  // Adjust this based on your needs (e.g., if you use external scripts/styles)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval and unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co", // Allow Supabase
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Permissions Policy (formerly Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify that the request is authenticated via Supabase
 * Returns the user ID if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  // Create Supabase client with the user's token
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Verify cron job secret for scheduled tasks
 * This prevents unauthorized access to cron endpoints
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return false;
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }

  return true;
}

/**
 * Validate request method
 */
export function validateMethod(request: NextRequest, allowedMethods: string[]): boolean {
  return allowedMethods.includes(request.method);
}

/**
 * Create error response with proper headers
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create success response with proper headers
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter(field => {
    return body[field] === undefined || body[field] === null || body[field] === '';
  });

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Rate limit check for specific actions (e.g., sending emails)
 * This is in addition to the global rate limit in middleware
 */
const actionRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkActionRateLimit(
  userId: string,
  action: string,
  maxRequests: number = 3, // Reduced from 5 to 3 for sensitive actions
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; reset: number } {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const record = actionRateLimits.get(key);

  if (!record || now > record.resetTime) {
    actionRateLimits.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      reset: now + windowMs,
    };
  }

  record.count++;

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    reset: record.resetTime,
  };
}

/**
 * Clean up old rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of actionRateLimits.entries()) {
    if (now > value.resetTime) {
      actionRateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Validate numeric range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && value >= min && value <= max;
}

/**
 * Example usage in an API route:
 *
 * export async function POST(request: NextRequest) {
 *   // Verify authentication
 *   const userId = await verifyAuth(request);
 *   if (!userId) {
 *     return errorResponse('Unauthorized', 401);
 *   }
 *
 *   // Validate method
 *   if (!validateMethod(request, ['POST'])) {
 *     return errorResponse('Method not allowed', 405);
 *   }
 *
 *   // Parse and validate body
 *   const body = await request.json();
 *   const validation = validateRequiredFields(body, ['email', 'message']);
 *   if (!validation.valid) {
 *     return errorResponse(`Missing required fields: ${validation.missing?.join(', ')}`, 400);
 *   }
 *
 *   // Check rate limit for this specific action
 *   const rateLimit = checkActionRateLimit(userId, 'send_email', 5, 60000);
 *   if (!rateLimit.allowed) {
 *     return errorResponse('Too many requests. Please try again later.', 429);
 *   }
 *
 *   // Process request...
 *   return successResponse({ success: true });
 * }
 */

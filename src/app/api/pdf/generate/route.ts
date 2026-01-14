import React, { ReactElement } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createServerClient } from '@supabase/ssr';
import { PaymentPlanPDF } from '@/components/pdf/PaymentPlanPDF';
import { OptimizationResult } from '@/types';

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
      console.error('[PDF Generate] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to generate PDFs.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { result } = body as { result: OptimizationResult };

    if (!result || !result.cards || result.cards.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payment plan data' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(PaymentPlanPDF, {
        result,
        generatedDate: new Date(),
      }) as ReactElement
    );

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="credit-optimization-plan-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

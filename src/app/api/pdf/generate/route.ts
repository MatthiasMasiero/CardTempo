import React, { ReactElement } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PaymentPlanPDF } from '@/components/pdf/PaymentPlanPDF';
import { OptimizationResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
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

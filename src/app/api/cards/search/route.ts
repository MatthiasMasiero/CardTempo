import { NextRequest, NextResponse } from 'next/server';
import creditCardsData from '@/data/credit-cards.json';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  imageUrl: string;
  category: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim() || '';

    // If no query, return empty array
    if (!query) {
      return NextResponse.json({ cards: [] });
    }

    // Simple search: filter by name, issuer, or category
    const filteredCards = creditCardsData.filter((card: CreditCard) => {
      const lowerName = card.name.toLowerCase();
      const lowerIssuer = card.issuer.toLowerCase();
      const lowerCategory = card.category.toLowerCase();

      return (
        lowerName.includes(query) ||
        lowerIssuer.includes(query) ||
        lowerCategory.includes(query)
      );
    });

    // Limit results to 15 to keep UI clean
    const limitedResults = filteredCards.slice(0, 15);

    return NextResponse.json({
      cards: limitedResults,
      total: filteredCards.length
    });

  } catch (error) {
    console.error('Error searching cards:', error);
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    );
  }
}

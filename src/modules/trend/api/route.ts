import { NextRequest, NextResponse } from 'next/server';
import { trendController } from '@/modules/trend/controllers/TrendController';

/**
 * GET /api/analysis/trend-analysis
 * Analyze trend for a given symbol
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json(
            { error: 'Symbol parameter is required' },
            { status: 400 }
        );
    }

    const result = await trendController.handleTrendAnalysis(symbol);

    if (!result.success) {
        return NextResponse.json(
            { error: result.error },
            { status: 500 }
        );
    }

    return NextResponse.json(result.data);
}

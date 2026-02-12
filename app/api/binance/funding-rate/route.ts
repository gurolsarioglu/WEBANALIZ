import { NextRequest, NextResponse } from 'next/server';
import { fetchFundingRate, fetchTopGainers } from '@/lib/binance-client';
import type { FundingRateResult } from '@/types';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json(
            { error: 'Symbol parameter is required' },
            { status: 400 }
        );
    }

    try {
        // Fetch funding rate and top gainers
        const [fundingData, topGainers] = await Promise.all([
            fetchFundingRate(symbol),
            fetchTopGainers(20),
        ]);

        // Find coin's rank in top gainers
        const coinRank = topGainers.findIndex(
            (gainer) => gainer.symbol.replace('/USDT', '') === symbol.replace('/USDT', '')
        ) + 1;

        const result: FundingRateResult = {
            currentRate: fundingData.fundingRate,
            timestamp: fundingData.fundingTimestamp,
            history: [
                {
                    timestamp: fundingData.fundingTimestamp,
                    rate: fundingData.fundingRate,
                },
            ],
            topGainers,
            coinRank: coinRank > 0 ? coinRank : undefined,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Funding rate error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch funding rate' },
            { status: 500 }
        );
    }
}

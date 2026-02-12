import { NextRequest, NextResponse } from 'next/server';
import { fetchLiquidationData, parseLiquidationLevels } from '@/lib/coinglass-client';
import type { LiquidationResult } from '@/types';

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
        // Extract base currency (e.g., 'BTC' from 'BTC/USDT')
        const baseCurrency = symbol.split('/')[0];

        // Fetch liquidation data
        const liquidationData = await fetchLiquidationData(baseCurrency);
        const parsedData = parseLiquidationLevels(liquidationData);

        console.log('Liquidation API Response:', JSON.stringify(parsedData, null, 2));

        const result: LiquidationResult = parsedData;

        return NextResponse.json(result);
    } catch (error) {
        console.error('Liquidation data error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch liquidation data' },
            { status: 500 }
        );
    }
}

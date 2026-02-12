import { NextRequest, NextResponse } from 'next/server';
import { fetchTicker, fetchOHLCV } from '@/lib/binance-client';
import { calculateSMA, calculateRSI, determineTrend } from '@/lib/indicators';
import type { BTCCorrelationResult } from '@/types';

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
        // Fetch BTC data
        const [btcTicker, btcWeeklyData, btcDailyData, coinTicker] = await Promise.all([
            fetchTicker('BTC/USDT'),
            fetchOHLCV('BTC/USDT', '1w', 200),
            fetchOHLCV('BTC/USDT', '1d', 200),
            fetchTicker(symbol),
        ]);

        // Analyze BTC weekly trend
        const btcWeeklySMA50 = calculateSMA(btcWeeklyData, 50);
        const btcWeeklySMA200 = calculateSMA(btcWeeklyData, 200);
        const btcWeeklyRSI = calculateRSI(btcWeeklyData, 14);
        const btcWeeklyTrend = determineTrend(
            btcWeeklySMA50[btcWeeklySMA50.length - 1],
            btcWeeklySMA200[btcWeeklySMA200.length - 1],
            btcWeeklyRSI[btcWeeklyRSI.length - 1]
        );

        // Analyze BTC daily trend
        const btcDailySMA50 = calculateSMA(btcDailyData, 50);
        const btcDailySMA200 = calculateSMA(btcDailyData, 200);
        const btcDailyRSI = calculateRSI(btcDailyData, 14);
        const btcDailyTrend = determineTrend(
            btcDailySMA50[btcDailySMA50.length - 1],
            btcDailySMA200[btcDailySMA200.length - 1],
            btcDailyRSI[btcDailyRSI.length - 1]
        );

        // Check correlation
        // If BTC is bearish but coin is pumping, it's a warning sign
        const coinChange = coinTicker.percentage || 0;
        const btcChange = btcTicker.percentage || 0;

        let correlation: 'ALIGNED' | 'DIVERGENT' = 'ALIGNED';
        let warning: string | undefined;

        if (btcDailyTrend === 'BEARISH' && coinChange > 5) {
            correlation = 'DIVERGENT';
            warning = '⚠️ DİKKAT: BTC Ters Yönlü - BTC düşüş trendinde iken altcoin yükselişte!';
        }

        const result: BTCCorrelationResult = {
            btcPrice: btcTicker.last || 0,
            btcTrend: {
                weekly: btcWeeklyTrend,
                daily: btcDailyTrend,
            },
            btcVolume: btcTicker.quoteVolume || 0,
            correlation,
            warning,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('BTC correlation error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze BTC correlation' },
            { status: 500 }
        );
    }
}

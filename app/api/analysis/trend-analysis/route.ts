import { NextRequest, NextResponse } from 'next/server';
import { fetchOHLCV } from '@/lib/binance-client';
import { calculateSMA, calculateRSI, determineTrend, getTrendEmoji } from '@/lib/indicators';
import type { TrendAnalysisResult } from '@/types';

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
        // Fetch weekly and daily data
        const [weeklyData, dailyData] = await Promise.all([
            fetchOHLCV(symbol, '1w', 200),
            fetchOHLCV(symbol, '1d', 200),
        ]);

        // Calculate indicators for weekly timeframe
        const weeklySMA50 = calculateSMA(weeklyData, 50);
        const weeklySMA200 = calculateSMA(weeklyData, 200);
        const weeklyRSI = calculateRSI(weeklyData, 14);

        const weeklyMA50 = weeklySMA50[weeklySMA50.length - 1];
        const weeklyMA200 = weeklySMA200[weeklySMA200.length - 1];
        const weeklyRSIValue = weeklyRSI[weeklyRSI.length - 1];
        const weeklyTrend = determineTrend(weeklyMA50, weeklyMA200, weeklyRSIValue);

        // Calculate indicators for daily timeframe
        const dailySMA50 = calculateSMA(dailyData, 50);
        const dailySMA200 = calculateSMA(dailyData, 200);
        const dailyRSI = calculateRSI(dailyData, 14);

        const dailyMA50 = dailySMA50[dailySMA50.length - 1];
        const dailyMA200 = dailySMA200[dailySMA200.length - 1];
        const dailyRSIValue = dailyRSI[dailyRSI.length - 1];
        const dailyTrend = determineTrend(dailyMA50, dailyMA200, dailyRSIValue);

        const result: TrendAnalysisResult = {
            weekly: {
                timeframe: '1W',
                ma50: weeklyMA50,
                ma200: weeklyMA200,
                rsi: weeklyRSIValue,
                trend: weeklyTrend,
                signal: getTrendEmoji(weeklyTrend),
            },
            daily: {
                timeframe: '1D',
                ma50: dailyMA50,
                ma200: dailyMA200,
                rsi: dailyRSIValue,
                trend: dailyTrend,
                signal: getTrendEmoji(dailyTrend),
            },
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Trend analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze trend' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { signalAggregatorController } from '../controllers/SignalAggregatorController';

/**
 * GET /api/signals/aggregate
 * Generate trading signal for a given symbol
 * 
 * Query Params:
 * - symbol: Trading pair (required, e.g., 'BTC/USDT')
 * - capital: Trading capital in USD (optional, default: 1000)
 * - riskPercent: Risk per trade (optional, default: 2)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const capital = searchParams.get('capital');
        const riskPercent = searchParams.get('riskPercent');

        if (!symbol) {
            return NextResponse.json(
                { success: false, error: 'Symbol parameter is required' },
                { status: 400 }
            );
        }

        const result = await signalAggregatorController.handleSignalRequest(
            symbol,
            capital ? parseFloat(capital) : undefined,
            riskPercent ? parseFloat(riskPercent) : undefined
        );

        if (!result.success) {
            return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Signal aggregator API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

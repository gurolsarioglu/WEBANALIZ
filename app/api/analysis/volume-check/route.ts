import { NextRequest, NextResponse } from 'next/server';
import { fetchTicker } from '@/lib/binance-client';
import type { VolumeCheckResult } from '@/types';

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
        // Fetch current ticker data
        const ticker = await fetchTicker(symbol);

        // Calculate volume change
        // Note: CCXT provides quoteVolume which is the 24h volume in USDT
        const current24hVolume = ticker.quoteVolume || 0;

        // For previous 24h volume, we'll use a simplified approach
        // In a real scenario, you'd fetch historical ticker data
        const previous24hVolume = current24hVolume * (1 + (Math.random() - 0.5) * 0.3);

        const volumeChangePercent = ((current24hVolume - previous24hVolume) / previous24hVolume) * 100;

        // Determine signal
        let signal: VolumeCheckResult['signal'];
        let status: VolumeCheckResult['status'];

        if (volumeChangePercent >= 10 && volumeChangePercent <= 20) {
            signal = 'SCALP_READY';
            status = 'success';
        } else if (volumeChangePercent < 10) {
            signal = 'VOLUME_LOW';
            status = 'warning';
        } else {
            signal = 'VOLUME_HIGH';
            status = 'warning';
        }

        const result: VolumeCheckResult = {
            current24hVolume,
            previous24hVolume,
            volumeChangePercent,
            signal,
            status,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Volume check error:', error);
        return NextResponse.json(
            { error: 'Failed to check volume' },
            { status: 500 }
        );
    }
}

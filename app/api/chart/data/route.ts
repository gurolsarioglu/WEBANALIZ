import { NextResponse } from 'next/server';
import { fetchOHLCV } from '@/shared/services/binance.service';
import { calculateDEMA } from '@/modules/chart-analysis/utils/dema';
import { calculateMavilim } from '@/modules/chart-analysis/utils/mavilim';
import { calculateNadaraya } from '@/modules/chart-analysis/utils/nadaraya';
import { calculatePMAX } from '@/modules/chart-analysis/utils/pmax';
import { calculateIchimoku } from '@/modules/chart-analysis/utils/ichimoku';
import { calculateSRSI } from '@/modules/chart-analysis/utils/stochastic-rsi';
import { calculateRSI } from '@/shared/utils/indicators';
import { detectSignals } from '@/modules/chart-analysis/utils/signal-detector';
import { calculateWTCross } from '@/modules/chart-analysis/utils/wtcross';
import { calculateLinRegBand } from '@/modules/chart-analysis/utils/linreg';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol') || 'BTC/USDT';
        const timeframe = searchParams.get('timeframe') || '5m';
        const limit = Math.min(parseInt(searchParams.get('limit') || '300'), 500);

        // Validate timeframe
        const validTimeframes = ['5m', '15m', '1h', '4h', '1d'];
        if (!validTimeframes.includes(timeframe)) {
            return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
        }

        // Fetch OHLCV data
        const candles = await fetchOHLCV(symbol, timeframe, limit);

        if (!candles || candles.length < 30) {
            return NextResponse.json({ error: 'Insufficient data' }, { status: 400 });
        }

        // Calculate all indicators
        const dema = calculateDEMA(candles, 9);
        const mavilim = calculateMavilim(candles, 3, 5);
        const nadaraya = calculateNadaraya(candles, 8, 3);
        const pmax = calculatePMAX(candles, 10, 3, 10);
        const ichimoku = calculateIchimoku(candles);
        const srsi = calculateSRSI(candles, 14, 14, 3, 3);
        const rsi = calculateRSI(candles, 14);
        const signals = detectSignals(candles);
        const wtcross = calculateWTCross(candles, 10, 21, 4);
        const linreg = calculateLinRegBand(candles, 100, 2);

        // Format response
        return NextResponse.json({
            candles: candles.map((c, i) => ({
                time: Math.floor(c.timestamp / 1000),
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume,
            })),
            indicators: {
                dema: dema.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                mavilim: mavilim.values.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                    color: mavilim.colors[i] === 'blue' ? '#3B82F6' : '#EF4444',
                })).filter(d => d.value !== null),
                nadarayaUpper: nadaraya.upperBand.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                nadarayaLower: nadaraya.lowerBand.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                pmax: pmax.values.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                    color: pmax.colors[i] === 'green' ? '#22C55E' : '#EF4444',
                })).filter(d => d.value !== null),
                rsi: rsi.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                ichimokuTenkan: ichimoku.tenkan.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                ichimokuKijun: ichimoku.kijun.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                srsiK: srsi.k.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                srsiD: srsi.d.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                wt1: wtcross.wt1.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                wt2: wtcross.wt2.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                linregMiddle: linreg.middle.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                linregUpper: linreg.upper.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
                linregLower: linreg.lower.map((v, i) => ({
                    time: Math.floor(candles[i].timestamp / 1000),
                    value: isNaN(v) ? null : v,
                })).filter(d => d.value !== null),
            },
            signals: signals.map(s => ({
                time: Math.floor(s.time / 1000),
                price: s.price,
                type: s.type,
                strength: s.strength,
                reasons: s.reasons,
            })),
        });
    } catch (error: unknown) {
        console.error('Chart data error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

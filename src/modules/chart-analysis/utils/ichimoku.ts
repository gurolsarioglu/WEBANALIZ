import type { CandleData } from '@/shared/types';

/**
 * Ichimoku Cloud Signals
 * Tenkan-Kijun cross signals for BUY/SELL detection
 */
export interface IchimokuResult {
    tenkan: number[];  // Conversion Line (9)
    kijun: number[];   // Base Line (26)
    signal: ('bullish' | 'bearish' | 'neutral')[];
}

export function calculateIchimoku(data: CandleData[]): IchimokuResult {
    const n = data.length;
    const tenkan = highLowMid(data, 9);
    const kijun = highLowMid(data, 26);

    const signal: ('bullish' | 'bearish' | 'neutral')[] = [];

    for (let i = 0; i < n; i++) {
        if (isNaN(tenkan[i]) || isNaN(kijun[i])) {
            signal.push('neutral');
        } else if (tenkan[i] > kijun[i]) {
            signal.push('bullish');
        } else if (tenkan[i] < kijun[i]) {
            signal.push('bearish');
        } else {
            signal.push('neutral');
        }
    }

    return { tenkan, kijun, signal };
}

/**
 * Detect Tenkan-Kijun crossover
 */
export function detectTKCross(ichimoku: IchimokuResult): { index: number; type: 'bullish' | 'bearish' }[] {
    const crosses: { index: number; type: 'bullish' | 'bearish' }[] = [];

    for (let i = 1; i < ichimoku.signal.length; i++) {
        if (ichimoku.signal[i] === 'bullish' && ichimoku.signal[i - 1] !== 'bullish') {
            crosses.push({ index: i, type: 'bullish' });
        } else if (ichimoku.signal[i] === 'bearish' && ichimoku.signal[i - 1] !== 'bearish') {
            crosses.push({ index: i, type: 'bearish' });
        }
    }

    return crosses;
}

function highLowMid(data: CandleData[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) { result.push(NaN); continue; }
        let high = -Infinity, low = Infinity;
        for (let j = i - period + 1; j <= i; j++) {
            if (data[j].high > high) high = data[j].high;
            if (data[j].low < low) low = data[j].low;
        }
        result.push((high + low) / 2);
    }
    return result;
}

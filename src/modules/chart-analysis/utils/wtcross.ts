import type { CandleData } from '@/shared/types';

/**
 * WaveTrend Cross (WTCross / LazyBear)
 * Momentum oscillator that detects overbought/oversold with crossovers
 */
export interface WTCrossResult {
    wt1: number[];  // Fast wave
    wt2: number[];  // Slow wave (signal)
    signal: ('buy' | 'sell' | 'neutral')[];
}

export function calculateWTCross(
    data: CandleData[],
    channelLen: number = 10,
    avgLen: number = 21,
    maLen: number = 4
): WTCrossResult {
    const n = data.length;

    // Step 1: Calculate typical price
    const hlc3 = data.map(d => (d.high + d.low + d.close) / 3);

    // Step 2: EMA of hlc3
    const esa = emaFromValues(hlc3, channelLen);

    // Step 3: EMA of absolute deviation
    const deviation = hlc3.map((v, i) => Math.abs(v - (isNaN(esa[i]) ? v : esa[i])));
    const d = emaFromValues(deviation, channelLen);

    // Step 4: CI (Channel Index)
    const ci = hlc3.map((v, i) => {
        if (isNaN(esa[i]) || isNaN(d[i]) || d[i] === 0) return 0;
        return (v - esa[i]) / (0.015 * d[i]);
    });

    // Step 5: WT1 = EMA of CI
    const wt1 = emaFromValues(ci, avgLen);

    // Step 6: WT2 = SMA of WT1
    const wt2 = smaFromValues(wt1, maLen);

    // Step 7: Crossover signals
    const signal: ('buy' | 'sell' | 'neutral')[] = [];
    for (let i = 0; i < n; i++) {
        if (i === 0 || isNaN(wt1[i]) || isNaN(wt2[i]) || isNaN(wt1[i - 1]) || isNaN(wt2[i - 1])) {
            signal.push('neutral');
            continue;
        }
        // Buy: WT1 crosses above WT2 in oversold zone
        if (wt1[i] > wt2[i] && wt1[i - 1] <= wt2[i - 1] && wt1[i] < -40) {
            signal.push('buy');
        }
        // Sell: WT1 crosses below WT2 in overbought zone
        else if (wt1[i] < wt2[i] && wt1[i - 1] >= wt2[i - 1] && wt1[i] > 40) {
            signal.push('sell');
        }
        else { signal.push('neutral'); }
    }

    return { wt1, wt2, signal };
}

function emaFromValues(values: number[], period: number): number[] {
    const result: number[] = [];
    const k = 2 / (period + 1);
    for (let i = 0; i < values.length; i++) {
        if (isNaN(values[i])) { result.push(NaN); continue; }
        if (i < period - 1) { result.push(NaN); }
        else if (i === period - 1) {
            let sum = 0, cnt = 0;
            for (let j = i - period + 1; j <= i; j++) {
                if (!isNaN(values[j])) { sum += values[j]; cnt++; }
            }
            result.push(cnt > 0 ? sum / cnt : NaN);
        } else {
            const prev = result[i - 1];
            if (isNaN(prev)) { result.push(NaN); continue; }
            result.push((values[i] - prev) * k + prev);
        }
    }
    return result;
}

function smaFromValues(values: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
        if (i < period - 1) { result.push(NaN); continue; }
        const slice = values.slice(i - period + 1, i + 1).filter(v => !isNaN(v));
        result.push(slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : NaN);
    }
    return result;
}

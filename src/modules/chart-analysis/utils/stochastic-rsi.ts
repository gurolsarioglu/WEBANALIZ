import type { CandleData } from '@/shared/types';

/**
 * Stochastic RSI
 * RSI applied to Stochastic formula
 */
export interface SRSIResult {
    k: number[];
    d: number[];
    signal: ('buy' | 'sell' | 'neutral')[];
}

export function calculateSRSI(
    data: CandleData[],
    rsiPeriod: number = 14,
    stochPeriod: number = 14,
    kSmooth: number = 3,
    dSmooth: number = 3
): SRSIResult {
    // Step 1: Calculate RSI
    const rsiValues = calculateRSIValues(data, rsiPeriod);

    // Step 2: Apply Stochastic to RSI
    const stochK: number[] = [];
    for (let i = 0; i < rsiValues.length; i++) {
        if (i < stochPeriod - 1 || isNaN(rsiValues[i])) {
            stochK.push(NaN);
            continue;
        }
        const slice = rsiValues.slice(i - stochPeriod + 1, i + 1).filter(v => !isNaN(v));
        if (slice.length === 0) { stochK.push(NaN); continue; }
        const highest = Math.max(...slice);
        const lowest = Math.min(...slice);
        const range = highest - lowest;
        stochK.push(range === 0 ? 50 : ((rsiValues[i] - lowest) / range) * 100);
    }

    // Step 3: Smooth K and D
    const k = smaFromValues(stochK, kSmooth);
    const d = smaFromValues(k, dSmooth);

    // Step 4: Generate signals
    const signal: ('buy' | 'sell' | 'neutral')[] = [];
    for (let i = 0; i < k.length; i++) {
        if (isNaN(k[i]) || isNaN(d[i])) { signal.push('neutral'); continue; }
        // Buy: K crosses above D in oversold zone
        if (i > 0 && k[i] > d[i] && k[i - 1] <= d[i - 1] && k[i] < 20) {
            signal.push('buy');
        }
        // Sell: K crosses below D in overbought zone
        else if (i > 0 && k[i] < d[i] && k[i - 1] >= d[i - 1] && k[i] > 80) {
            signal.push('sell');
        }
        else { signal.push('neutral'); }
    }

    return { k, d, signal };
}

function calculateRSIValues(data: CandleData[], period: number): number[] {
    const result: number[] = [NaN];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);

        if (i < period) { result.push(NaN); continue; }

        const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

        if (avgLoss === 0) { result.push(100); }
        else {
            const rs = avgGain / avgLoss;
            result.push(100 - (100 / (1 + rs)));
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

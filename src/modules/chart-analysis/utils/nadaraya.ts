import type { CandleData } from '@/shared/types';

/**
 * Nadaraya-Watson Envelope
 * Non-parametric kernel regression with ATR-based envelopes
 */
export interface NadarayaResult {
    smoothed: number[];
    upperBand: number[];
    lowerBand: number[];
}

export function calculateNadaraya(
    data: CandleData[],
    bandwidth: number = 8,
    multiplier: number = 3,
    lookback: number = 200
): NadarayaResult {
    const closes = data.map(d => d.close);
    const n = closes.length;
    const start = Math.max(0, n - lookback);

    const smoothed: number[] = new Array(n).fill(NaN);
    const upperBand: number[] = new Array(n).fill(NaN);
    const lowerBand: number[] = new Array(n).fill(NaN);

    // Calculate ATR for envelope width
    const atrValues = simpleATR(data, 14);

    // Kernel regression for visible range
    for (let i = start; i < n; i++) {
        let weightedSum = 0;
        let weightSum = 0;

        const rangeStart = Math.max(start, i - lookback);
        for (let j = rangeStart; j < n; j++) {
            const distance = (i - j) / bandwidth;
            const weight = gaussianKernel(distance);
            weightedSum += weight * closes[j];
            weightSum += weight;
        }

        if (weightSum > 0) {
            const estimate = weightedSum / weightSum;
            smoothed[i] = estimate;

            const atr = atrValues[i] || 0;
            upperBand[i] = estimate + multiplier * atr;
            lowerBand[i] = estimate - multiplier * atr;
        }
    }

    return { smoothed, upperBand, lowerBand };
}

function gaussianKernel(u: number): number {
    return Math.exp(-0.5 * u * u);
}

function simpleATR(data: CandleData[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            result.push(data[i].high - data[i].low);
            continue;
        }
        const tr = Math.max(
            data[i].high - data[i].low,
            Math.abs(data[i].high - data[i - 1].close),
            Math.abs(data[i].low - data[i - 1].close)
        );
        if (i < period) {
            result.push(tr);
        } else {
            const prev = result[i - 1];
            result.push((prev * (period - 1) + tr) / period);
        }
    }
    return result;
}

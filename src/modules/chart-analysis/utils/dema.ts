import type { CandleData } from '@/shared/types';

/**
 * DEMA - Double Exponential Moving Average
 * Formula: DEMA = 2 * EMA(period) - EMA(EMA(period))
 */
export function calculateDEMA(data: CandleData[], period: number = 9): number[] {
    const closes = data.map(d => d.close);
    const ema1 = emaFromValues(closes, period);
    const ema2 = emaFromValues(ema1, period);

    return ema1.map((val, i) => {
        if (isNaN(val) || isNaN(ema2[i])) return NaN;
        return 2 * val - ema2[i];
    });
}

function emaFromValues(values: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);

    for (let i = 0; i < values.length; i++) {
        if (isNaN(values[i])) {
            result.push(NaN);
            continue;
        }
        if (i < period - 1) {
            result.push(NaN);
        } else if (i === period - 1) {
            // First value = SMA
            let sum = 0;
            let count = 0;
            for (let j = i - period + 1; j <= i; j++) {
                if (!isNaN(values[j])) { sum += values[j]; count++; }
            }
            result.push(count > 0 ? sum / count : NaN);
        } else {
            const prev = result[i - 1];
            if (isNaN(prev)) { result.push(NaN); continue; }
            result.push((values[i] - prev) * multiplier + prev);
        }
    }
    return result;
}

import type { CandleData } from '@/shared/types';

/**
 * Mavilim W - Fibonacci-based Weighted Moving Average
 * Uses cascading WMAs with Fibonacci periods
 * Blue when rising (uptrend), Red when falling (downtrend)
 */
export interface MavilimResult {
    values: number[];
    colors: ('blue' | 'red')[];
}

export function calculateMavilim(
    data: CandleData[],
    first: number = 3,
    second: number = 5
): MavilimResult {
    const closes = data.map(d => d.close);

    // Generate Fibonacci sequence
    const fib = generateFibonacci(10);

    // First WMA with Fibonacci period
    const period1 = fib[first] || first;
    const wma1 = wmaFromValues(closes, period1);

    // Second WMA applied to first WMA result
    const period2 = fib[second] || second;
    const wma2 = wmaFromValues(wma1, period2);

    // Determine colors based on direction
    const colors: ('blue' | 'red')[] = wma2.map((val, i) => {
        if (i === 0 || isNaN(val) || isNaN(wma2[i - 1])) return 'blue';
        return val >= wma2[i - 1] ? 'blue' : 'red';
    });

    return { values: wma2, colors };
}

function generateFibonacci(count: number): number[] {
    const fib = [1, 1];
    for (let i = 2; i < count; i++) {
        fib.push(fib[i - 1] + fib[i - 2]);
    }
    return fib;
}

function wmaFromValues(values: number[], period: number): number[] {
    const result: number[] = [];
    const weightSum = (period * (period + 1)) / 2;

    for (let i = 0; i < values.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
            continue;
        }

        let sum = 0;
        let validWeights = 0;
        for (let j = 0; j < period; j++) {
            const val = values[i - period + 1 + j];
            if (!isNaN(val)) {
                const weight = j + 1;
                sum += val * weight;
                validWeights += weight;
            }
        }
        result.push(validWeights > 0 ? sum / validWeights : NaN);
    }
    return result;
}

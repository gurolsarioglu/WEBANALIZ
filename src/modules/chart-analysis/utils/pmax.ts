import type { CandleData } from '@/shared/types';

/**
 * PMAX - Profit Maximizer
 * Combines SuperTrend logic with EMA-based trend change detection
 */
export interface PMAXResult {
    values: number[];
    directions: (1 | -1)[];  // 1 = uptrend, -1 = downtrend
    colors: ('green' | 'red')[];
}

export function calculatePMAX(
    data: CandleData[],
    atrPeriod: number = 10,
    atrMultiplier: number = 3,
    maLength: number = 10
): PMAXResult {
    const n = data.length;
    const closes = data.map(d => d.close);

    // Calculate EMA of closes
    const ema = emaFromValues(closes, maLength);

    // Calculate ATR
    const atr = calculateATR(data, atrPeriod);

    const values: number[] = new Array(n).fill(NaN);
    const directions: (1 | -1)[] = new Array(n).fill(1);
    const colors: ('green' | 'red')[] = new Array(n).fill('green');

    const longStop: number[] = new Array(n).fill(0);
    const shortStop: number[] = new Array(n).fill(0);

    for (let i = 0; i < n; i++) {
        if (isNaN(ema[i]) || isNaN(atr[i])) continue;

        // Calculate bands
        const basicLongStop = ema[i] - (atrMultiplier * atr[i]);
        const basicShortStop = ema[i] + (atrMultiplier * atr[i]);

        // Long stop
        if (i === 0 || isNaN(longStop[i - 1])) {
            longStop[i] = basicLongStop;
        } else {
            longStop[i] = ema[i - 1] > longStop[i - 1]
                ? Math.max(basicLongStop, longStop[i - 1])
                : basicLongStop;
        }

        // Short stop
        if (i === 0 || isNaN(shortStop[i - 1])) {
            shortStop[i] = basicShortStop;
        } else {
            shortStop[i] = ema[i - 1] < shortStop[i - 1]
                ? Math.min(basicShortStop, shortStop[i - 1])
                : basicShortStop;
        }

        // Direction
        if (i === 0) {
            directions[i] = 1;
        } else {
            const prevDir = directions[i - 1];
            if (prevDir === -1 && ema[i] > shortStop[i - 1]) {
                directions[i] = 1;
            } else if (prevDir === 1 && ema[i] < longStop[i - 1]) {
                directions[i] = -1;
            } else {
                directions[i] = prevDir;
            }
        }

        // PMAX value
        values[i] = directions[i] === 1 ? longStop[i] : shortStop[i];
        colors[i] = directions[i] === 1 ? 'green' : 'red';
    }

    return { values, directions, colors };
}

function emaFromValues(values: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    for (let i = 0; i < values.length; i++) {
        if (i < period - 1) { result.push(NaN); }
        else if (i === period - 1) {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) sum += values[j];
            result.push(sum / period);
        } else {
            result.push((values[i] - result[i - 1]) * multiplier + result[i - 1]);
        }
    }
    return result;
}

function calculateATR(data: CandleData[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        const tr = i === 0
            ? data[i].high - data[i].low
            : Math.max(
                data[i].high - data[i].low,
                Math.abs(data[i].high - data[i - 1].close),
                Math.abs(data[i].low - data[i - 1].close)
            );
        if (i < period) { result.push(tr); }
        else { result.push((result[i - 1] * (period - 1) + tr) / period); }
    }
    return result;
}

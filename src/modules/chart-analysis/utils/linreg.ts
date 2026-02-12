import type { CandleData } from '@/shared/types';

/**
 * Linear Regression Band (LinReg Band)
 * Draws a linear regression channel around price action
 */
export interface LinRegResult {
    middle: number[];   // Regression line
    upper: number[];    // Upper band
    lower: number[];    // Lower band
}

export function calculateLinRegBand(
    data: CandleData[],
    period: number = 100,
    deviationMult: number = 2
): LinRegResult {
    const n = data.length;
    const closes = data.map(d => d.close);
    const middle: number[] = new Array(n).fill(NaN);
    const upper: number[] = new Array(n).fill(NaN);
    const lower: number[] = new Array(n).fill(NaN);

    for (let i = period - 1; i < n; i++) {
        const slice = closes.slice(i - period + 1, i + 1);

        // Linear regression
        const { slope, intercept } = linearRegression(slice);

        // Regression value at current point
        const regValue = slope * (period - 1) + intercept;
        middle[i] = regValue;

        // Standard deviation for bandwidth
        let sumSqDev = 0;
        for (let j = 0; j < period; j++) {
            const predicted = slope * j + intercept;
            const diff = slice[j] - predicted;
            sumSqDev += diff * diff;
        }
        const stdDev = Math.sqrt(sumSqDev / period);

        upper[i] = regValue + deviationMult * stdDev;
        lower[i] = regValue - deviationMult * stdDev;
    }

    return { middle, upper, lower };
}

function linearRegression(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

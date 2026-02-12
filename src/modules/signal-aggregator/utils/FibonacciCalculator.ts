import type { CandleData } from '@/shared/types';

/**
 * Fibonacci Levels Interface
 */
export interface FibonacciLevels {
    high: number;
    low: number;
    level_0: number;      // 0% (High)
    level_236: number;    // 23.6%
    level_382: number;    // 38.2%
    level_500: number;    // 50%
    level_618: number;    // 61.8% (Golden Ratio)
    level_786: number;    // 78.6%
    level_100: number;    // 100% (Low)
}

/**
 * Calculate Fibonacci Retracement Levels
 * @param candles - Historical candle data
 * @param lookback - Number of candles to look back (default 50)
 * @returns Fibonacci levels
 */
export function calculateFibonacci(
    candles: CandleData[],
    lookback: number = 50
): FibonacciLevels {
    if (!candles || candles.length < 2) {
        throw new Error('Insufficient candle data for Fibonacci calculation');
    }

    // Get recent candles
    const recentCandles = candles.slice(-lookback);

    // Find swing high and low
    const high = Math.max(...recentCandles.map(c => c.high));
    const low = Math.min(...recentCandles.map(c => c.low));
    const diff = high - low;

    return {
        high,
        low,
        level_0: high,                              // 0%
        level_236: high - (diff * 0.236),          // 23.6%
        level_382: high - (diff * 0.382),          // 38.2%
        level_500: high - (diff * 0.500),          // 50%
        level_618: high - (diff * 0.618),          // 61.8% Golden Ratio
        level_786: high - (diff * 0.786),          // 78.6%
        level_100: low,                             // 100%
    };
}

/**
 * Check if current price is near a Fibonacci level
 * @param price - Current price
 * @param fibonacci - Fibonacci levels
 * @param threshold - Proximity threshold (default 0.5%)
 * @returns { level, distance } or null
 */
export function findNearestFibLevel(
    price: number,
    fibonacci: FibonacciLevels,
    threshold: number = 0.005
): { level: string; price: number; distance: number } | null {
    const levels = [
        { name: '0.0%', value: fibonacci.level_0 },
        { name: '23.6%', value: fibonacci.level_236 },
        { name: '38.2%', value: fibonacci.level_382 },
        { name: '50.0%', value: fibonacci.level_500 },
        { name: '61.8%', value: fibonacci.level_618 },
        { name: '78.6%', value: fibonacci.level_786 },
        { name: '100%', value: fibonacci.level_100 },
    ];

    for (const level of levels) {
        const distance = Math.abs(price - level.value) / price;
        if (distance <= threshold) {
            return {
                level: level.name,
                price: level.value,
                distance: distance * 100, // as percentage
            };
        }
    }

    return null;
}

/**
 * Determine if price is in a "value zone" (good for buying)
 * Typically between 50% and 78.6% retracement
 */
export function isInValueZone(price: number, fibonacci: FibonacciLevels): boolean {
    return price >= fibonacci.level_786 && price <= fibonacci.level_500;
}

/**
 * Determine if price is in "premium zone" (good for selling)
 * Typically between 0% and 38.2% retracement
 */
export function isInPremiumZone(price: number, fibonacci: FibonacciLevels): boolean {
    return price >= fibonacci.level_382 && price <= fibonacci.level_0;
}

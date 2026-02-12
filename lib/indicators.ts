/**
 * Technical Indicators Library
 * Implements MA (Moving Average) and RSI (Relative Strength Index)
 */

interface CandleData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param data - Array of candle data
 * @param period - MA period (e.g., 50, 200)
 */
export function calculateSMA(data: CandleData[], period: number): number[] {
    const sma: number[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(NaN);
            continue;
        }

        const sum = data
            .slice(i - period + 1, i + 1)
            .reduce((acc, candle) => acc + candle.close, 0);

        sma.push(sum / period);
    }

    return sma;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param data - Array of candle data
 * @param period - RSI period (default: 14)
 */
export function calculateRSI(data: CandleData[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate RSI
    for (let i = 0; i < gains.length; i++) {
        if (i < period - 1) {
            rsi.push(NaN);
            continue;
        }

        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;

        if (avgLoss === 0) {
            rsi.push(100);
        } else {
            const rs = avgGain / avgLoss;
            rsi.push(100 - (100 / (1 + rs)));
        }
    }

    return rsi;
}

/**
 * Determine trend based on MA and RSI
 * @param ma50 - 50-period MA value
 * @param ma200 - 200-period MA value
 * @param rsi - RSI value
 */
export function determineTrend(
    ma50: number,
    ma200: number,
    rsi: number
): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    // Golden Cross or Death Cross
    if (ma50 > ma200 && rsi > 50) {
        return 'BULLISH';
    } else if (ma50 < ma200 && rsi < 50) {
        return 'BEARISH';
    } else {
        return 'NEUTRAL';
    }
}

/**
 * Get emoji signal for trend
 */
export function getTrendEmoji(trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'): '🐂' | '🐻' | '➖' {
    switch (trend) {
        case 'BULLISH':
            return '🐂';
        case 'BEARISH':
            return '🐻';
        case 'NEUTRAL':
            return '➖';
    }
}

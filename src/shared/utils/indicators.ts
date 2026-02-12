/**
 * Technical Indicators Library
 * Implements MA (Moving Average) and RSI (Relative Strength Index)
 */

import type { CandleData } from '@/shared/types';
import { INDICATOR_PERIODS } from '@/shared/config/constants';

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
export function calculateRSI(data: CandleData[], period: number = INDICATOR_PERIODS.RSI): number[] {
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

/**
 * Calculate Exponential Moving Average (EMA)
 * @param data - Array of candle data
 * @param period - EMA period
 */
export function calculateEMA(data: CandleData[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);

    // First EMA is SMA
    const sma = calculateSMA(data, period);

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            ema.push(NaN);
        } else if (i === period - 1) {
            ema.push(sma[i]);
        } else {
            const value = (data[i].close - ema[i - 1]) * multiplier + ema[i - 1];
            ema.push(value);
        }
    }

    return ema;
}

/**
 * Calculate Average True Range (ATR)
 * Used for volatility-based stop-loss calculation
 * @param data - Array of candle data
 * @param period - ATR period (default: 14)
 */
export function calculateATR(data: CandleData[], period: number = 14): number[] {
    if (data.length < 2) {
        return [];
    }

    const trueRanges: number[] = [];

    // Calculate True Range for each candle
    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            // First candle: TR = High - Low
            trueRanges.push(data[i].high - data[i].low);
        } else {
            // TR = max(High-Low, |High-PrevClose|, |Low-PrevClose|)
            const prevClose = data[i - 1].close;
            const tr = Math.max(
                data[i].high - data[i].low,
                Math.abs(data[i].high - prevClose),
                Math.abs(data[i].low - prevClose)
            );
            trueRanges.push(tr);
        }
    }

    // Calculate ATR using EMA of True Ranges
    const atr: number[] = [];
    const multiplier = 2 / (period + 1);

    for (let i = 0; i < trueRanges.length; i++) {
        if (i < period - 1) {
            atr.push(NaN);
        } else if (i === period - 1) {
            // First ATR is simple average
            const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            atr.push(sum / period);
        } else {
            // Subsequent ATR uses EMA formula
            const value = (trueRanges[i] - atr[i - 1]) * multiplier + atr[i - 1];
            atr.push(value);
        }
    }

    return atr;
}

/**
 * Get latest valid indicator value
 * @param values - Array of indicator values (may contain NaN)
 * @returns Last valid number or 0
 */
export function getLatestValue(values: number[]): number {
    for (let i = values.length - 1; i >= 0; i--) {
        if (!isNaN(values[i])) {
            return values[i];
        }
    }
    return 0;
}

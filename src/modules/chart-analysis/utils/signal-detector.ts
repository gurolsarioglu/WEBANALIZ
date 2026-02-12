import type { CandleData } from '@/shared/types';
import { calculateDEMA } from './dema';
import { calculatePMAX } from './pmax';
import { calculateNadaraya } from './nadaraya';
import { calculateIchimoku, detectTKCross } from './ichimoku';
import { calculateSRSI } from './stochastic-rsi';
import { calculateRSI } from '@/shared/utils/indicators';

/**
 * Trading Signal
 */
export interface ChartSignal {
    index: number;
    time: number;
    price: number;
    type: 'BUY' | 'SELL';
    strength: number; // 1-6 (number of confirming indicators)
    reasons: string[];
}

/**
 * Detect BUY/SELL signals using multi-indicator confluence
 * Signal triggers when 3+ indicators agree
 */
export function detectSignals(data: CandleData[]): ChartSignal[] {
    if (data.length < 50) return [];

    const signals: ChartSignal[] = [];

    // Calculate all indicators
    const dema = calculateDEMA(data, 9);
    const pmax = calculatePMAX(data, 10, 3, 10);
    const nadaraya = calculateNadaraya(data, 8, 3);
    const ichimoku = calculateIchimoku(data);
    const tkCrosses = detectTKCross(ichimoku);
    const srsi = calculateSRSI(data, 14, 14, 3, 3);
    const rsi = calculateRSI(data, 14);

    // Build cross index set for quick lookup
    const bullishCrossSet = new Set(tkCrosses.filter(c => c.type === 'bullish').map(c => c.index));
    const bearishCrossSet = new Set(tkCrosses.filter(c => c.type === 'bearish').map(c => c.index));

    for (let i = 30; i < data.length; i++) {
        const close = data[i].close;
        const buyReasons: string[] = [];
        const sellReasons: string[] = [];

        // 1. Nadaraya-Watson band touch
        if (!isNaN(nadaraya.lowerBand[i]) && close <= nadaraya.lowerBand[i]) {
            buyReasons.push('NW alt bandına değdi');
        }
        if (!isNaN(nadaraya.upperBand[i]) && close >= nadaraya.upperBand[i]) {
            sellReasons.push('NW üst bandına değdi');
        }

        // 2. PMAX direction change
        if (pmax.directions[i] === 1 && i > 0 && pmax.directions[i - 1] === -1) {
            buyReasons.push('PMAX yeşile döndü');
        }
        if (pmax.directions[i] === -1 && i > 0 && pmax.directions[i - 1] === 1) {
            sellReasons.push('PMAX kırmızıya döndü');
        }
        // Also: price above/below PMAX
        if (!isNaN(pmax.values[i]) && close > pmax.values[i] && pmax.directions[i] === 1) {
            buyReasons.push('Fiyat PMAX üzerinde');
        }
        if (!isNaN(pmax.values[i]) && close < pmax.values[i] && pmax.directions[i] === -1) {
            sellReasons.push('Fiyat PMAX altında');
        }

        // 3. DEMA crossover
        if (!isNaN(dema[i]) && !isNaN(dema[i - 1])) {
            if (close > dema[i] && data[i - 1].close <= dema[i - 1]) {
                buyReasons.push('DEMA9 yukarı kesiş');
            }
            if (close < dema[i] && data[i - 1].close >= dema[i - 1]) {
                sellReasons.push('DEMA9 aşağı kesiş');
            }
        }

        // 4. RSI oversold/overbought
        const rsiVal = rsi[rsi.length - data.length + i];
        if (!isNaN(rsiVal)) {
            if (rsiVal < 35) buyReasons.push(`RSI(${rsiVal.toFixed(0)}) aşırı satım`);
            if (rsiVal > 65) sellReasons.push(`RSI(${rsiVal.toFixed(0)}) aşırı alım`);
        }

        // 5. Stochastic RSI signal
        if (srsi.signal[i] === 'buy') buyReasons.push('SRSI K>D crossover');
        if (srsi.signal[i] === 'sell') sellReasons.push('SRSI K<D crossover');

        // 6. Ichimoku TK Cross
        if (bullishCrossSet.has(i)) buyReasons.push('Ichimoku TK bullish cross');
        if (bearishCrossSet.has(i)) sellReasons.push('Ichimoku TK bearish cross');

        // Generate signal if 3+ confirmations
        if (buyReasons.length >= 3) {
            signals.push({
                index: i,
                time: data[i].timestamp,
                price: close,
                type: 'BUY',
                strength: Math.min(6, buyReasons.length),
                reasons: buyReasons,
            });
        }

        if (sellReasons.length >= 3) {
            signals.push({
                index: i,
                time: data[i].timestamp,
                price: close,
                type: 'SELL',
                strength: Math.min(6, sellReasons.length),
                reasons: sellReasons,
            });
        }
    }

    return signals;
}

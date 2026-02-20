/**
 * Technical Indicators: RSI, Stochastic RSI, WT Cross
 */
import type { CandleData } from './types';

// ─── RSI ───
export type RSICrossSignal = 'bullish_cross' | 'bearish_cross' | 'none';

export function calculateRSI(data: CandleData[], period = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = 0; i < gains.length; i++) {
        if (i < period - 1) { rsi.push(NaN); continue; }
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
    }
    return rsi;
}

/**
 * RSI Kesişim Tespiti
 * RSI sinyal çizgisi = 9 periyotluk SMA(RSI)
 * RSI sinyal çizgisinin altına iniyor (>80 bölgesinde) → bearish_cross (SHORT giriş)
 * RSI sinyal çizgisinin üstüne çıkıyor (<20 bölgesinde) → bullish_cross (LONG giriş)
 */
export function detectRSICross(rsiValues: number[], signalPeriod = 14): RSICrossSignal {
    // RSI sinyal çizgisi (SMA of RSI)
    const signal: number[] = [];
    for (let i = 0; i < rsiValues.length; i++) {
        if (i < signalPeriod - 1 || isNaN(rsiValues[i])) { signal.push(NaN); continue; }
        const slice = rsiValues.slice(i - signalPeriod + 1, i + 1).filter(v => !isNaN(v));
        signal.push(slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : NaN);
    }

    const len = rsiValues.length;
    if (len < 2) return 'none';

    const rsiNow = rsiValues[len - 1], sigNow = signal[len - 1];
    const rsiPrev = rsiValues[len - 2], sigPrev = signal[len - 2];

    if (isNaN(rsiNow) || isNaN(sigNow) || isNaN(rsiPrev) || isNaN(sigPrev)) return 'none';

    // RSI, sinyal çizgisinin üstüne çıkıyor (oversold → LONG)
    if (rsiNow > sigNow && rsiPrev <= sigPrev && rsiNow <= 30) return 'bullish_cross';
    // RSI, sinyal çizgisinin altına iniyor (overbought → SHORT)
    if (rsiNow < sigNow && rsiPrev >= sigPrev && rsiNow >= 70) return 'bearish_cross';

    return 'none';
}

// ─── Stochastic RSI ───
export type SRSICrossSignal = 'bullish_cross' | 'bearish_cross' | 'none';

export function calculateSRSI(data: CandleData[], rsiPeriod = 14, stochPeriod = 14, kSmooth = 3, dSmooth = 3) {
    const rsiValues = calculateRSIValues(data, rsiPeriod);

    const stochK: number[] = [];
    for (let i = 0; i < rsiValues.length; i++) {
        if (i < stochPeriod - 1 || isNaN(rsiValues[i])) { stochK.push(NaN); continue; }
        const slice = rsiValues.slice(i - stochPeriod + 1, i + 1).filter(v => !isNaN(v));
        if (!slice.length) { stochK.push(NaN); continue; }
        const hi = Math.max(...slice), lo = Math.min(...slice), range = hi - lo;
        stochK.push(range === 0 ? 50 : ((rsiValues[i] - lo) / range) * 100);
    }

    const k = sma(stochK, kSmooth);
    const d = sma(k, dSmooth);

    // K/D kesişim tespiti
    let cross: SRSICrossSignal = 'none';
    const len = k.length;
    if (len >= 2) {
        const kNow = k[len - 1], dNow = d[len - 1];
        const kPrev = k[len - 2], dPrev = d[len - 2];
        if (!isNaN(kNow) && !isNaN(dNow) && !isNaN(kPrev) && !isNaN(dPrev)) {
            // K yukarı kesiyor (oversold → LONG giriş)
            if (kNow > dNow && kPrev <= dPrev && kNow <= 25) cross = 'bullish_cross';
            // K aşağı kesiyor (overbought → SHORT giriş)
            if (kNow < dNow && kPrev >= dPrev && kNow >= 75) cross = 'bearish_cross';
        }
    }

    return { k, d, cross };
}

function calculateRSIValues(data: CandleData[], period: number): number[] {
    const result: number[] = [NaN];
    const gains: number[] = [], losses: number[] = [];
    for (let i = 1; i < data.length; i++) {
        const ch = data[i].close - data[i - 1].close;
        gains.push(ch > 0 ? ch : 0);
        losses.push(ch < 0 ? Math.abs(ch) : 0);
        if (i < period) { result.push(NaN); continue; }
        const ag = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
        const al = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
        result.push(al === 0 ? 100 : 100 - 100 / (1 + ag / al));
    }
    return result;
}

// ─── WT Cross (LazyBear) ───
export function calculateWTCross(data: CandleData[], channelLen = 10, avgLen = 21, maLen = 4) {
    const hlc3 = data.map(d => (d.high + d.low + d.close) / 3);
    const esa = ema(hlc3, channelLen);
    const deviation = hlc3.map((v, i) => Math.abs(v - (isNaN(esa[i]) ? v : esa[i])));
    const d = ema(deviation, channelLen);
    const ci = hlc3.map((v, i) => {
        if (isNaN(esa[i]) || isNaN(d[i]) || d[i] === 0) return 0;
        return (v - esa[i]) / (0.015 * d[i]);
    });
    const wt1 = ema(ci, avgLen);
    const wt2 = sma(wt1, maLen);

    const signal: ('buy' | 'sell' | 'neutral')[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i === 0 || isNaN(wt1[i]) || isNaN(wt2[i]) || isNaN(wt1[i - 1]) || isNaN(wt2[i - 1])) {
            signal.push('neutral'); continue;
        }
        if (wt1[i] > wt2[i] && wt1[i - 1] <= wt2[i - 1] && wt1[i] < -40) signal.push('buy');
        else if (wt1[i] < wt2[i] && wt1[i - 1] >= wt2[i - 1] && wt1[i] > 40) signal.push('sell');
        else signal.push('neutral');
    }
    return { wt1, wt2, signal };
}

// ─── Helpers ───
function ema(values: number[], period: number): number[] {
    const result: number[] = [];
    const k = 2 / (period + 1);
    for (let i = 0; i < values.length; i++) {
        if (isNaN(values[i])) { result.push(NaN); continue; }
        if (i < period - 1) result.push(NaN);
        else if (i === period - 1) {
            let sum = 0, cnt = 0;
            for (let j = i - period + 1; j <= i; j++) { if (!isNaN(values[j])) { sum += values[j]; cnt++; } }
            result.push(cnt > 0 ? sum / cnt : NaN);
        } else {
            const prev = result[i - 1];
            result.push(isNaN(prev) ? NaN : (values[i] - prev) * k + prev);
        }
    }
    return result;
}

function sma(values: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
        if (i < period - 1) { result.push(NaN); continue; }
        const s = values.slice(i - period + 1, i + 1).filter(v => !isNaN(v));
        result.push(s.length > 0 ? s.reduce((a, b) => a + b, 0) / s.length : NaN);
    }
    return result;
}

export function lastValid(values: number[]): number {
    for (let i = values.length - 1; i >= 0; i--) if (!isNaN(values[i])) return values[i];
    return 0;
}

/**
 * RSI Aşırı Bölge Birikim Tespiti
 * RSI'ın 80 üstünde veya 20 altında kaç mum kaldığını sayar
 * Stoch RSI K/D kesişimini de kontrol eder
 */
export interface RSIAccumulation {
    count: number;          // Kaç mum aşırı bölgede kaldı
    zone: 'OVERBOUGHT' | 'OVERSOLD' | 'NONE';
    peakRSI: number;        // Bölgedeki en uç RSI değeri
    stochCrossInZone: boolean; // K/D aşırı bölgede kesişti mi
}

export function detectRSIAccumulation(
    rsiValues: number[],
    srsiK: number[],
    srsiD: number[],
): RSIAccumulation {
    let count = 0;
    let zone: 'OVERBOUGHT' | 'OVERSOLD' | 'NONE' = 'NONE';
    let peakRSI = 0;
    let stochCrossInZone = false;

    // Son mumdan geriye doğru say
    for (let i = rsiValues.length - 1; i >= 0; i--) {
        const rsi = rsiValues[i];
        if (isNaN(rsi)) break;

        if (rsi >= 80) {
            if (zone === 'NONE') zone = 'OVERBOUGHT';
            if (zone !== 'OVERBOUGHT') break;
            count++;
            if (rsi > peakRSI) peakRSI = rsi;
        } else if (rsi <= 20) {
            if (zone === 'NONE') zone = 'OVERSOLD';
            if (zone !== 'OVERSOLD') break;
            count++;
            if (peakRSI === 0 || rsi < peakRSI) peakRSI = rsi;
        } else {
            break; // Aşırı bölgeden çıktı
        }

        // K/D kesişimi kontrol (aşırı bölgede)
        if (i > 0 && !isNaN(srsiK[i]) && !isNaN(srsiD[i]) && !isNaN(srsiK[i - 1]) && !isNaN(srsiD[i - 1])) {
            if (zone === 'OVERBOUGHT' && srsiK[i] < srsiD[i] && srsiK[i - 1] >= srsiD[i - 1]) {
                stochCrossInZone = true; // K, D'nin altına geçti (aşırı alımda satış sinyali)
            }
            if (zone === 'OVERSOLD' && srsiK[i] > srsiD[i] && srsiK[i - 1] <= srsiD[i - 1]) {
                stochCrossInZone = true; // K, D'nin üstüne geçti (aşırı satımda alış sinyali)
            }
        }
    }

    return { count, zone, peakRSI, stochCrossInZone };
}

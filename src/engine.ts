/**
 * Signal Engine — analyze coins, generate signals with FR filter
 */
import { fetchOHLCV, fetchFundingRate, fetchLSRatio, getActivePairs } from './binance';
import { calculateRSI, calculateSRSI, calculateWTCross, lastValid, detectRSIAccumulation, detectRSICross } from './indicators';
import { CONFIG } from './config';
import type { TradeSignal, TradeDirection, TimeframeData, MultiTimeframeData, FRAssessment, ProfitCalc } from './types';

const signalHistory = new Map<string, number>();

/** Analyze single timeframe */
async function analyzeTF(symbol: string, tf: string): Promise<TimeframeData | null> {
    try {
        const candles = await fetchOHLCV(symbol, tf, CONFIG.CANDLE_COUNT);
        if (!candles || candles.length < 50) return null;

        const rsiVals = calculateRSI(candles, 14);
        const rsi = lastValid(rsiVals);
        const srsi = calculateSRSI(candles, 14, 14, 3, 3);
        const srsiK = lastValid(srsi.k), srsiD = lastValid(srsi.d);
        const wt = calculateWTCross(candles, 10, 21, 4);
        const idx = candles.length - 1;

        // Hacim Değişimi Hesaplama (Bir önceki muma göre)
        const prevVol = idx > 0 ? candles[idx - 1].volume : 0;
        const volNow = candles[idx].volume;
        const volumeChangePct = prevVol > 0 ? ((volNow - prevVol) / prevVol) * 100 : 0;

        // RSI birikim ve kesişim tespiti
        const accum = detectRSIAccumulation(rsiVals, srsi.k, srsi.d);
        const rsiCross = detectRSICross(rsiVals, 14);

        return {
            timeframe: tf, rsi, srsiK, srsiD,
            wtCrossSignal: wt.signal[idx] || 'neutral',
            wt1: lastValid(wt.wt1), wt2: lastValid(wt.wt2),
            trend: rsi > 55 ? 'BULLISH' : rsi < 45 ? 'BEARISH' : 'NEUTRAL',
            close: candles[idx].close,
            volumeChangePct,
            rsiCross: rsiCross,
            srsiCross: srsi.cross,
            accumulation: {
                count: accum.count,
                zone: accum.zone,
                peakRSI: accum.peakRSI,
                stochCross: accum.stochCrossInZone,
            },
        };
    } catch (err) {
        console.error(`[TF] ${symbol} ${tf} hata:`, err);
        return null;
    }
}

/** Get multi-timeframe data */
async function getMultiTF(symbol: string): Promise<MultiTimeframeData | null> {
    const [tf5, tf15, tf1h, tf4h, tf1d] = await Promise.all([
        analyzeTF(symbol, '5m'), analyzeTF(symbol, '15m'),
        analyzeTF(symbol, '1h'), analyzeTF(symbol, '4h'), analyzeTF(symbol, '1d'),
    ]);
    if (!tf5 || !tf15 || !tf1h || !tf4h || !tf1d) return null;
    return { entry: { '5m': tf5, '15m': tf15 }, direction: { '1h': tf1h, '4h': tf4h, '1d': tf1d } };
}

/** Assess Funding Rate */
async function assessFR(symbol: string): Promise<FRAssessment> {
    try {
        const rate = await fetchFundingRate(symbol);
        const lsRatio = await fetchLSRatio(symbol);
        const ratePct = rate * 100;
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED' = 'LOW';
        let allowLong = true, allowShort = true;

        if (rate >= CONFIG.FR_DANGER_2) { riskLevel = 'BLOCKED'; allowLong = false; }
        else if (rate >= CONFIG.FR_DANGER_1) { riskLevel = 'HIGH'; allowLong = false; }
        else if (rate <= -CONFIG.FR_DANGER_2) { riskLevel = 'BLOCKED'; allowShort = false; }
        else if (rate <= -CONFIG.FR_DANGER_1) { riskLevel = 'HIGH'; allowShort = false; }
        else if (Math.abs(rate) > 0.0005) { riskLevel = 'MEDIUM'; }

        return { rate, ratePct, riskLevel, allowLong, allowShort, lsRatio };
    } catch {
        return { rate: 0, ratePct: 0, riskLevel: 'MEDIUM', allowLong: true, allowShort: true, lsRatio: 1 };
    }
}

/** Check signal conditions */
function checkConditions(mtf: MultiTimeframeData, dir: TradeDirection) {
    const reasons: string[] = [], warnings: string[] = [];
    const tfs = [mtf.entry['5m'], mtf.entry['15m']];

    for (const tf of tfs) {
        if (dir === 'LONG') {
            if (tf.rsi <= CONFIG.RSI_LONG) reasons.push(`${tf.timeframe} RSI ${tf.rsi.toFixed(0)} ≤ 20`);
            if (tf.wtCrossSignal === 'buy') reasons.push(`${tf.timeframe} WT 🟢`);
            if (tf.srsiK <= CONFIG.SRSI_LONG + CONFIG.SRSI_TOLERANCE) reasons.push(`${tf.timeframe} SRSI K ${tf.srsiK.toFixed(0)} ≈ 0`);
            if (tf.rsiCross === 'bullish_cross') reasons.push(`${tf.timeframe} RSI ✂️ Kesişim`);
            if (tf.srsiCross === 'bullish_cross') reasons.push(`${tf.timeframe} SRSI K/D ✂️ Kesişim`);
        } else {
            if (tf.rsi >= CONFIG.RSI_SHORT) reasons.push(`${tf.timeframe} RSI ${tf.rsi.toFixed(0)} ≥ 80`);
            if (tf.wtCrossSignal === 'sell') reasons.push(`${tf.timeframe} WT 🔴`);
            if (tf.srsiK >= CONFIG.SRSI_SHORT - CONFIG.SRSI_TOLERANCE) reasons.push(`${tf.timeframe} SRSI K ${tf.srsiK.toFixed(0)} ≈ 100`);
            if (tf.rsiCross === 'bearish_cross') reasons.push(`${tf.timeframe} RSI ✂️ Kesişim`);
            if (tf.srsiCross === 'bearish_cross') reasons.push(`${tf.timeframe} SRSI K/D ✂️ Kesişim`);
        }
    }

    let trendOk = 0;
    for (const tf of [mtf.direction['1h'], mtf.direction['4h'], mtf.direction['1d']]) {
        const expected = dir === 'LONG' ? 'BULLISH' : 'BEARISH';
        if (tf.trend === expected) { trendOk++; reasons.push(`${tf.timeframe} ${tf.trend}`); }
        else warnings.push(`${tf.timeframe} ${tf.trend}`);
    }

    const entryCount = reasons.filter(r => r.includes('RSI') || r.includes('WT') || r.includes('SRSI')).length;
    return { met: entryCount >= 3 && trendOk >= 2, reasons, warnings };
}

/** Calculate profit */
function calcProfit(price: number, dir: TradeDirection): ProfitCalc {
    const { LEVERAGE, ENTRY_AMOUNT, TARGET_PROFIT_PCT } = CONFIG;
    const move = (TARGET_PROFIT_PCT / 100) / LEVERAGE;
    const target = dir === 'LONG' ? price * (1 + move) : price * (1 - move);
    const profitPct = (Math.abs(target - price) / price) * LEVERAGE * 100;
    return {
        entryPrice: price, targetPrice: target,
        entryUSD: ENTRY_AMOUNT, leveragedUSD: ENTRY_AMOUNT * LEVERAGE,
        profitUSD: ENTRY_AMOUNT * (profitPct / 100), profitPct,
    };
}

/** Is duplicate signal? */
function isDup(symbol: string, dir: TradeDirection): boolean {
    const key = `${symbol}_${dir}`;
    const ts = signalHistory.get(key);
    return !!ts && Date.now() - ts < CONFIG.SIGNAL_COOLDOWN_MS;
}

/** Full analysis of one symbol */
export async function analyzeSymbol(symbol: string): Promise<TradeSignal | null> {
    try {
        if (isDup(symbol, 'LONG') && isDup(symbol, 'SHORT')) return null;

        const mtf = await getMultiTF(symbol);
        if (!mtf) return null;

        const longChk = checkConditions(mtf, 'LONG');
        const shortChk = checkConditions(mtf, 'SHORT');

        let dir: TradeDirection | null = null;
        let chk = { met: false, reasons: [] as string[], warnings: [] as string[] };

        if (longChk.met && !isDup(symbol, 'LONG')) { dir = 'LONG'; chk = longChk; }
        else if (shortChk.met && !isDup(symbol, 'SHORT')) { dir = 'SHORT'; chk = shortChk; }

        if (!dir) return null;

        // FR as filter
        const fr = await assessFR(symbol);
        let status: 'ACTIVE' | 'WARNING' | 'BLOCKED' = 'ACTIVE';
        if (dir === 'LONG' && !fr.allowLong) status = fr.riskLevel === 'BLOCKED' ? 'BLOCKED' : 'WARNING';
        if (dir === 'SHORT' && !fr.allowShort) status = fr.riskLevel === 'BLOCKED' ? 'BLOCKED' : 'WARNING';

        // BLOCKED signals are not sent — FR as hard filter
        if (status === 'BLOCKED') {
            console.log(`[Engine] ${symbol} ${dir} sinyal bulundu ama FR BLOCKED — atlanıyor.`);
            return null;
        }

        const price = mtf.entry['15m'].close;
        const profit = calcProfit(price, dir);

        const signal: TradeSignal = {
            timestamp: Date.now(), symbol, direction: dir, status,
            entryPrice: price, targetPrice: profit.targetPrice,
            profit, multiTF: mtf, fr,
            strength: chk.reasons.length, reasons: chk.reasons, warnings: chk.warnings,
        };

        signalHistory.set(`${symbol}_${dir}`, Date.now());
        return signal;
    } catch (err) {
        console.error(`[Engine] ${symbol} hata:`, err);
        return null;
    }
}

/** Scan all pairs */
export async function scanAll(): Promise<TradeSignal[]> {
    const pairs = await getActivePairs();
    console.log(`[Engine] ${pairs.length} coin taranıyor...`);

    const signals: TradeSignal[] = [];
    for (let i = 0; i < pairs.length; i += CONFIG.BATCH_SIZE) {
        const batch = pairs.slice(i, i + CONFIG.BATCH_SIZE);
        const results = await Promise.allSettled(batch.map(s => analyzeSymbol(s)));
        for (const r of results) {
            if (r.status === 'fulfilled' && r.value) signals.push(r.value);
        }
        if (i + CONFIG.BATCH_SIZE < pairs.length) await delay(CONFIG.BATCH_DELAY_MS);
    }
    console.log(`[Engine] Tarama bitti. ${signals.length} sinyal bulundu.`);
    return signals;
}

/** Clean old history */
export function cleanHistory() {
    const now = Date.now();
    for (const [k, ts] of signalHistory) {
        if (now - ts > CONFIG.SIGNAL_COOLDOWN_MS * 2) signalHistory.delete(k);
    }
}

function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

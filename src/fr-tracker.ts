/**
 * FR Tracker — Sinyal gönderildikten sonra FR değişimlerini takip eder
 * FR önemli ölçüde değişirse güncelleme mesajı gönderir (1., 2., 3....)
 */

import { fetchFundingRate, fetchLSRatio } from './binance';
import { buildFRUpdateMessage } from './messages';
import { sendMessage, isConfigured } from './telegram';
import type { TradeSignal, FRAssessment } from './types';
import { CONFIG } from './config';

interface TrackedSignal {
    signal: TradeSignal;
    lastFR: number;
    lastLSRatio: number;
    updateCount: number;
    createdAt: number;
}

// Active tracked signals
const tracked = new Map<string, TrackedSignal>();

// FR check interval: 5 minutes
const FR_CHECK_INTERVAL = 5 * 60 * 1000;

// FR değişim eşiği: %0.005 (0.00005) değişirse güncelleme gönder
const FR_CHANGE_THRESHOLD = 0.00005;

// Maximum tracking time: 4 hours (sonra takibi bırak)
const MAX_TRACK_MS = 4 * 60 * 60 * 1000;

// Maximum updates per signal
const MAX_UPDATES = 10;

/**
 * Start tracking a signal's FR
 */
export function trackSignal(signal: TradeSignal): void {
    const key = `${signal.symbol}_${signal.direction}`;
    tracked.set(key, {
        signal,
        lastFR: signal.fr.rate,
        lastLSRatio: signal.fr.lsRatio,
        updateCount: 0,
        createdAt: Date.now(),
    });
    console.log(`[FR Tracker] ${signal.symbol} ${signal.direction} takibe alındı (FR: ${(signal.fr.ratePct).toFixed(4)}%)`);
}

/**
 * Check all tracked signals for FR changes
 */
async function checkFRUpdates(): Promise<void> {
    if (tracked.size === 0) return;

    const now = Date.now();

    for (const [key, item] of tracked) {
        // Expired?
        if (now - item.createdAt > MAX_TRACK_MS) {
            console.log(`[FR Tracker] ${item.signal.symbol} süresi doldu, takipten çıkarıldı.`);
            tracked.delete(key);
            continue;
        }

        // Max updates reached?
        if (item.updateCount >= MAX_UPDATES) {
            tracked.delete(key);
            continue;
        }

        try {
            const newFR = await fetchFundingRate(item.signal.symbol);
            const newLSRatio = await fetchLSRatio(item.signal.symbol);
            const frChange = Math.abs(newFR - item.lastFR);

            // Significant FR change?
            if (frChange >= FR_CHANGE_THRESHOLD) {
                item.updateCount++;
                const oldFR = item.lastFR;

                item.lastFR = newFR;
                item.lastLSRatio = newLSRatio;

                const frDirection = newFR > oldFR ? '📈 ARTTI' : '📉 DÜŞTÜ';

                // Build FR risk level
                let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED' = 'LOW';
                if (Math.abs(newFR) >= CONFIG.FR_DANGER_2) riskLevel = 'BLOCKED';
                else if (Math.abs(newFR) >= CONFIG.FR_DANGER_1) riskLevel = 'HIGH';
                else if (Math.abs(newFR) > 0.0005) riskLevel = 'MEDIUM';

                const updatedFR: FRAssessment = {
                    rate: newFR,
                    ratePct: newFR * 100,
                    riskLevel,
                    allowLong: newFR < CONFIG.FR_DANGER_1,
                    allowShort: newFR > -CONFIG.FR_DANGER_1,
                    lsRatio: newLSRatio,
                };

                const msg = buildFRUpdateMessage(
                    item.signal,
                    updatedFR,
                    oldFR * 100,
                    item.updateCount,
                    frDirection,
                );

                console.log(`[FR Tracker] ${item.signal.symbol} FR güncelleme #${item.updateCount}: ${(oldFR * 100).toFixed(4)}% → ${(newFR * 100).toFixed(4)}%`);

                if (isConfigured()) {
                    await sendMessage(msg);
                } else {
                    console.log(msg.replace(/<[^>]+>/g, ''));
                }
            }
        } catch (err) {
            console.error(`[FR Tracker] ${item.signal.symbol} hata:`, err);
        }
    }
}

/**
 * Start FR tracking loop
 */
let intervalId: ReturnType<typeof setInterval> | null = null;

export function startFRTracker(): void {
    if (intervalId) return;
    intervalId = setInterval(checkFRUpdates, FR_CHECK_INTERVAL);
    console.log(`[FR Tracker] Aktif — ${FR_CHECK_INTERVAL / 60000}dk aralıklı kontrol`);
}

export function stopFRTracker(): void {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    tracked.clear();
}

/** Get tracked count */
export function getTrackedCount(): number {
    return tracked.size;
}

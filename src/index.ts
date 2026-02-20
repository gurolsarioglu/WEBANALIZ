/**
 * Nokta — Crypto Sinyal Botu
 * npm start ile çalıştır, 15dk aralıklı otomatik tarama yapar
 * FR değişimlerini 5dk aralıklı takip eder
 */

// Load .env
import { readFileSync } from 'fs';
import { resolve } from 'path';
try {
    const envPath = resolve(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const value = trimmed.substring(eqIdx + 1).trim();
            if (!process.env[key]) process.env[key] = value;
        }
    }
} catch { }

import { scanAll, cleanHistory } from './engine';
import { buildSignalMessage } from './messages';
import { sendMessage, isConfigured } from './telegram';
import { trackSignal, startFRTracker, getTrackedCount } from './fr-tracker';
import { CONFIG } from './config';

let totalScans = 0;
let totalSignals = 0;

async function runScan() {
    totalScans++;
    console.log(`\n━━━ Tarama #${totalScans} ━━━ ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`);

    try {
        const signals = await scanAll();

        for (const signal of signals) {
            totalSignals++;
            const msg = buildSignalMessage(signal);
            console.log(`\n[SİNYAL] ${signal.direction} ${signal.symbol}`);

            if (isConfigured()) {
                const sent = await sendMessage(msg);
                console.log(`[Telegram] ${sent ? '✅ Gönderildi' : '❌ Gönderilemedi'}`);
            } else {
                console.log('[Telegram] Token ayarlanmamış, konsola yazdırılıyor:');
                console.log(msg.replace(/<[^>]+>/g, ''));
            }

            // FR takibine al
            trackSignal(signal);
        }

        cleanHistory();
        console.log(`━━━ Tarama bitti. Sinyaller: ${signals.length} | Toplam: ${totalSignals} | FR Takip: ${getTrackedCount()} ━━━`);
    } catch (err) {
        console.error('[Hata] Tarama başarısız:', err);
    }
}

async function main() {
    console.log('🎯 Nokta Sinyal Botu başlatılıyor...');
    console.log(`   Kaldıraç: ${CONFIG.LEVERAGE}x | Giriş: $${CONFIG.ENTRY_AMOUNT} | Hedef: %${CONFIG.TARGET_PROFIT_PCT}`);
    console.log(`   Tarama Aralığı: ${CONFIG.SCAN_INTERVAL_MS / 60000} dakika`);
    console.log(`   FR Takip: 5dk aralıklı kontrol`);
    console.log(`   Telegram: ${isConfigured() ? '✅ Ayarlandı' : '❌ Token eksik'}`);
    console.log('');

    // Start FR tracker (5dk aralıklı)
    startFRTracker();

    // Initial scan
    await runScan();

    // Schedule periodic scans
    setInterval(runScan, CONFIG.SCAN_INTERVAL_MS);
    console.log(`\n⏰ Sonraki tarama ${CONFIG.SCAN_INTERVAL_MS / 60000} dakika sonra...`);
}

main().catch(console.error);

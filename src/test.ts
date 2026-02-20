/**
 * Test — Tek coin analizi
 * npm test ile çalıştır
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

import { analyzeSymbol } from './engine';
import { buildSignalMessage } from './messages';
import { sendMessage, isConfigured } from './telegram';

const symbol = process.argv[2] || 'BTC/USDT';

async function test() {
    console.log(`🔍 ${symbol} analiz ediliyor...\n`);

    const signal = await analyzeSymbol(symbol);

    if (signal) {
        const msg = buildSignalMessage(signal);
        console.log('✅ SİNYAL BULUNDU:\n');
        console.log(msg.replace(/<[^>]+>/g, ''));

        if (isConfigured()) {
            const sent = await sendMessage(msg);
            console.log(`\n[Telegram] ${sent ? '✅ Gönderildi' : '❌ Gönderilemedi'}`);
        }
    } else {
        console.log('❌ Sinyal koşulları sağlanmadı.');
    }
}

test().catch(console.error);

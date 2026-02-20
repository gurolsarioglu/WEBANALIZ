/**
 * Message Templates — compact Telegram format
 */
import type { TradeSignal, FRAssessment } from './types';

function formatPrice(p: number): string {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    return p.toFixed(6);
}

function formatTime(ts: number): string {
    return new Date(ts).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });
}

function rsiStars(rsi: number, dir: 'LONG' | 'SHORT'): string {
    if (dir === 'LONG') { if (rsi <= 15) return ' ⭐⭐'; if (rsi <= 20) return ' ⭐'; }
    else { if (rsi >= 85) return ' ⭐⭐'; if (rsi >= 80) return ' ⭐'; }
    return '';
}

function stochMarks(k: number, d: number, dir: 'LONG' | 'SHORT'): string {
    if (dir === 'SHORT') {
        if (k >= 100 && d >= 100) return ' ❗❗❗';
        if (k >= 100 && d >= 90) return ' ❗❗';
        if (k >= 90 && d >= 90) return ' ❗';
    } else {
        if (k <= 0 && d <= 0) return ' ❗❗❗';
        if (k <= 0 && d <= 10) return ' ❗❗';
        if (k <= 10 && d <= 10) return ' ❗';
    }
    return '';
}

function frEmoji(level: string): string {
    return level === 'LOW' ? '✅' : level === 'MEDIUM' ? '⚡' : level === 'HIGH' ? '⚠️' : '🚫';
}

function accumLine(tf: { accumulation: { count: number; zone: string; peakRSI: number; stochCross: boolean } }): string | null {
    const a = tf.accumulation;
    if (a.count < 2 || a.zone === 'NONE') return null;
    const emoji = a.zone === 'OVERBOUGHT' ? '🔴' : '🟢';
    const label = a.zone === 'OVERBOUGHT' ? 'Aşırı alım' : 'Aşırı satım';
    const cross = a.stochCross ? ' | K/D ✂️' : '';
    return `${emoji} ${label}: ${a.count} mum (zirve RSI: ${a.peakRSI.toFixed(0)})${cross}`;
}

function formatVolumeChange(pct: number): string {
    const sign = pct >= 0 ? '+' : '';
    const val = pct.toFixed(0);
    let stars = '';

    // Gelen isteğe göre önem derecelerine göre yıldız
    if (pct >= 100 || pct <= -100) stars = ' ⭐⭐⭐';
    else if (pct >= 50 || pct <= -50) stars = ' ⭐⭐';
    else if (pct >= 20 || pct <= -20) stars = ' ⭐';

    return `📊 Hacim 15dk: ${sign}%${val}${stars}`;
}

/**
 * Ana sinyal mesajı
 */
export function buildSignalMessage(signal: TradeSignal): string {
    const dirEmoji = signal.direction === 'LONG' ? '📈' : '📉';
    const dirLabel = signal.direction === 'LONG' ? 'BUY 🟢' : 'SELL 🔴';
    const coinSymbol = signal.symbol.replace('/', '');
    const tf15 = signal.multiTF.entry['15m'];
    const tf5 = signal.multiTF.entry['5m'];
    const tf1h = signal.multiTF.direction['1h'];
    const tf4h = signal.multiTF.direction['4h'];
    const tf1d = signal.multiTF.direction['1d'];
    const fr = signal.fr;
    const tag = (tf15.rsi <= 20 || tf15.rsi >= 80) ? ' (Sinyal)' : '';

    const lines: string[] = [];

    lines.push(`${dirEmoji} [15DK] #${coinSymbol} ${dirLabel}`);
    if (signal.status === 'BLOCKED') lines.push('❌ FR TEHLİKELİ - İŞLEME GİRME!');
    else if (signal.status === 'WARNING') lines.push('⚠️ FR RİSKLİ - DİKKATLİ OL!');
    lines.push('──────────────────');
    lines.push(`• Fiyat: ${formatPrice(signal.entryPrice)}`);
    const accum15 = accumLine(tf15);
    if (accum15) lines.push(`• ${accum15}`);
    lines.push(`• 15dk RSI: ${tf15.rsi.toFixed(0)}${rsiStars(tf15.rsi, signal.direction)}${tag}`);
    if (tf15.rsiCross !== 'none') lines.push(`• ✂️ RSI Kesişim! ${tf15.rsiCross === 'bullish_cross' ? '🟢 Yukarı' : '🔴 Aşağı'}`);
    lines.push(`• 5dk RSI: ${tf5.rsi.toFixed(0)}${rsiStars(tf5.rsi, signal.direction)}`);
    lines.push(`• 1 Saatlik RSI: ${tf1h.rsi.toFixed(0)}${rsiStars(tf1h.rsi, signal.direction)}`);
    lines.push(`• 4 Saatlik RSI: ${tf4h.rsi.toFixed(0)}${rsiStars(tf4h.rsi, signal.direction)}`);
    lines.push(`• Günlük RSI: ${tf1d.rsi.toFixed(0)}`);
    lines.push(`• Stoch: ${tf15.srsiK.toFixed(0)}(K)/${tf15.srsiD.toFixed(0)}(D)${stochMarks(tf15.srsiK, tf15.srsiD, signal.direction)}`);
    if (tf15.srsiCross !== 'none') lines.push(`• ✂️ SRSI K/D Kesişim! ${tf15.srsiCross === 'bullish_cross' ? '🟢 Yukarı' : '🔴 Aşağı'}`);
    lines.push(`• WT: ${tf15.wtCrossSignal === 'buy' ? '🟢' : tf15.wtCrossSignal === 'sell' ? '🔴' : '⚪'}`);
    lines.push(`• FR: ${fr.ratePct.toFixed(4)}% ${frEmoji(fr.riskLevel)} L/S: ${fr.lsRatio.toFixed(2)}`);
    lines.push(`• ${formatVolumeChange(tf15.volumeChangePct)}`);
    lines.push('──────────────────');
    lines.push(`🔗 <a href="https://www.binance.com/en/futures/${coinSymbol}">Binance Futures</a> | ⏰ ${formatTime(signal.timestamp)}`);

    return lines.join('\n');
}

/**
 * FR güncelleme mesajı (1., 2., 3....)
 */
export function buildFRUpdateMessage(
    signal: TradeSignal,
    newFR: FRAssessment,
    oldFRPct: number,
    updateNo: number,
    frDirection: string,
): string {
    const dirEmoji = signal.direction === 'LONG' ? '📈' : '📉';
    const dirLabel = signal.direction === 'LONG' ? 'BUY 🟢' : 'SELL 🔴';
    const coinSymbol = signal.symbol.replace('/', '');
    const tf15 = signal.multiTF.entry['15m'];
    const tf5 = signal.multiTF.entry['5m'];
    const tf1h = signal.multiTF.direction['1h'];
    const tf4h = signal.multiTF.direction['4h'];
    const tf1d = signal.multiTF.direction['1d'];
    const tag = (tf15.rsi <= 20 || tf15.rsi >= 80) ? ' (Sinyal)' : '';

    const lines: string[] = [];

    lines.push(`🔄 FR GÜNCELLEMESİ ${updateNo}. — #${coinSymbol}`);
    lines.push(`${dirEmoji} ${dirLabel} | ${frDirection}`);

    // FR danger warning
    if (newFR.riskLevel === 'BLOCKED') {
        lines.push('❌ FR TEHLİKELİ - İŞLEME GİRME!');
    } else if (newFR.riskLevel === 'HIGH') {
        lines.push('⚠️ FR RİSKLİ - DİKKATLİ OL!');
    }

    lines.push('──────────────────');
    lines.push(`• Fiyat: ${formatPrice(signal.entryPrice)}`);
    const accum15 = accumLine(tf15);
    if (accum15) lines.push(`• ${accum15}`);
    lines.push(`• 15dk RSI: ${tf15.rsi.toFixed(0)}${rsiStars(tf15.rsi, signal.direction)}${tag}`);
    if (tf15.rsiCross !== 'none') lines.push(`• ✂️ RSI Kesişim! ${tf15.rsiCross === 'bullish_cross' ? '🟢 Yukarı' : '🔴 Aşağı'}`);
    lines.push(`• 5dk RSI: ${tf5.rsi.toFixed(0)}${rsiStars(tf5.rsi, signal.direction)}`);
    lines.push(`• 1 Saatlik RSI: ${tf1h.rsi.toFixed(0)}${rsiStars(tf1h.rsi, signal.direction)}`);
    lines.push(`• 4 Saatlik RSI: ${tf4h.rsi.toFixed(0)}${rsiStars(tf4h.rsi, signal.direction)}`);
    lines.push(`• Günlük RSI: ${tf1d.rsi.toFixed(0)}`);
    lines.push(`• Stoch: ${tf15.srsiK.toFixed(0)}(K)/${tf15.srsiD.toFixed(0)}(D)${stochMarks(tf15.srsiK, tf15.srsiD, signal.direction)}`);
    if (tf15.srsiCross !== 'none') lines.push(`• ✂️ SRSI K/D Kesişim! ${tf15.srsiCross === 'bullish_cross' ? '🟢 Yukarı' : '🔴 Aşağı'}`);
    lines.push(`• WT: ${tf15.wtCrossSignal === 'buy' ? '🟢' : tf15.wtCrossSignal === 'sell' ? '🔴' : '⚪'}`);
    lines.push(`• FR: ${oldFRPct.toFixed(4)}% → <b>${newFR.ratePct.toFixed(4)}%</b> ${frEmoji(newFR.riskLevel)} L/S: ${newFR.lsRatio.toFixed(2)}`);
    lines.push(`• ${formatVolumeChange(tf15.volumeChangePct)}`);
    lines.push('──────────────────');
    lines.push(`🔗 <a href="https://www.binance.com/en/futures/${coinSymbol}">Binance Futures</a> | ⏰ ${formatTime(Date.now())}`);

    return lines.join('\n');
}

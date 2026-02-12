'use client';

import type { ChartData } from './CandlestickChart';

interface Props {
    data: ChartData | null;
    capital: number;
    symbol: string;
}

/**
 * Trading bilgi paneli - Giriş, Stop Loss, TP1, TP2, Position Size, Max Loss, Potential Profit
 * Grafik ekranının altına eklenir.
 */
export default function TradingInfoPanel({ data, capital, symbol }: Props) {
    if (!data || data.signals.length === 0) {
        return (
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 mt-3">
                <div className="text-center text-gray-500 text-sm py-4">
                    📊 Sinyal bekleniyor... Henüz giriş/çıkış noktası tespit edilmedi.
                </div>
            </div>
        );
    }

    // Get latest signal
    const lastSignal = data.signals[data.signals.length - 1];
    const isBuy = lastSignal.type === 'BUY';
    const entry = lastSignal.price;
    const lastCandle = data.candles[data.candles.length - 1];
    const currentPrice = lastCandle?.close ?? entry;

    // Calculate recent ATR for SL/TP calculation
    const recentCandles = data.candles.slice(-14);
    let sumTR = 0;
    for (let i = 1; i < recentCandles.length; i++) {
        const c = recentCandles[i];
        const prev = recentCandles[i - 1];
        const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
        sumTR += tr;
    }
    const atr = sumTR / (recentCandles.length - 1);

    // SL and TP levels
    const slMultiplier = 1.5;
    const tp1Multiplier = 2.0;
    const tp2Multiplier = 3.5;

    const stopLoss = isBuy ? entry - atr * slMultiplier : entry + atr * slMultiplier;
    const tp1 = isBuy ? entry + atr * tp1Multiplier : entry - atr * tp1Multiplier;
    const tp2 = isBuy ? entry + atr * tp2Multiplier : entry - atr * tp2Multiplier;

    const slPercent = Math.abs((stopLoss - entry) / entry * 100);
    const tp1Percent = Math.abs((tp1 - entry) / entry * 100);
    const tp2Percent = Math.abs((tp2 - entry) / entry * 100);

    // Risk/Reward Ratios
    const rr1 = tp1Percent / slPercent;
    const rr2 = tp2Percent / slPercent;

    // Position size (risk 2% of capital)
    const riskPercent = 2;
    const riskAmount = capital * riskPercent / 100;
    const slDistance = Math.abs(entry - stopLoss);
    const positionSize = slDistance > 0 ? riskAmount / slDistance : capital;
    const positionValue = Math.min(positionSize * entry, capital);

    // Max loss and potential profit
    const maxLoss = positionSize * slDistance;
    const potentialProfit1 = positionSize * Math.abs(tp1 - entry);
    const potentialProfit2 = positionSize * Math.abs(tp2 - entry);

    // Signal direction
    const direction = isBuy ? 'LONG' : 'SHORT';
    const dirColor = isBuy ? 'text-green-400' : 'text-red-400';
    const dirBg = isBuy ? 'bg-green-900/30 border-green-700/30' : 'bg-red-900/30 border-red-700/30';

    // Confidence score from signal strength
    const confidence = Math.round((lastSignal.strength / 6) * 100);

    const formatPrice = (p: number) => {
        if (p >= 100) return p.toFixed(2);
        if (p >= 1) return p.toFixed(4);
        return p.toFixed(6);
    };

    return (
        <div className="bg-gradient-to-b from-gray-900/90 to-gray-950/90 backdrop-blur border border-gray-800 rounded-xl overflow-hidden mt-3">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🎯</span>
                    <div>
                        <h3 className="text-white font-bold text-sm">Trading Sinyali <span className="text-gray-500 font-normal text-xs">{symbol}</span></h3>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${dirBg}`}>
                    <span className={dirColor}>{direction}</span>
                    <span className="text-gray-400 ml-1.5">Güven: {confidence}%</span>
                </div>
            </div>

            {/* Signal + Confidence */}
            <div className="grid grid-cols-2 gap-3 p-4 pb-2">
                <div className={`rounded-xl border p-3 ${dirBg}`}>
                    <div className="text-3xl mb-1">{isBuy ? '📈' : '📉'}</div>
                    <div className={`text-xl font-black ${dirColor}`}>{direction}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{isBuy ? 'Alım yap' : 'Satış yap'}</div>
                </div>
                <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-3">
                    <div className="text-gray-400 text-xs mb-1">Güven Skoru</div>
                    <div className="text-white text-3xl font-black">{confidence}%</div>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${confidence >= 60 ? 'bg-green-500' : confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${confidence}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Price Levels */}
            <div className="px-4 py-2">
                <h4 className="text-gray-300 text-xs font-semibold mb-2 flex items-center gap-1.5">💰 Fiyat Seviyeleri</h4>
                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1">📍 Giriş</div>
                        <div className="text-white font-bold text-sm">${formatPrice(entry)}</div>
                    </div>
                    <div className="bg-red-900/20 border border-red-700/20 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1">🔴 Stop Loss</div>
                        <div className="text-white font-bold text-sm">${formatPrice(stopLoss)}</div>
                        <div className="text-red-400 text-[10px] mt-0.5">-{slPercent.toFixed(2)}%</div>
                    </div>
                    <div className="bg-green-900/15 border border-green-700/20 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1">🟢 TP1</div>
                        <div className="text-white font-bold text-sm">${formatPrice(tp1)}</div>
                        <div className="text-green-400 text-[10px] mt-0.5">+{tp1Percent.toFixed(2)}%</div>
                        <div className="text-gray-500 text-[9px]">R/R: 1:{rr1.toFixed(1)}</div>
                    </div>
                    <div className="bg-green-900/20 border border-green-700/25 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1">💎 TP2</div>
                        <div className="text-white font-bold text-sm">${formatPrice(tp2)}</div>
                        <div className="text-green-400 text-[10px] mt-0.5">+{tp2Percent.toFixed(2)}%</div>
                        <div className="text-gray-500 text-[9px]">R/R: 1:{rr2.toFixed(1)}</div>
                    </div>
                </div>
            </div>

            {/* Position Info */}
            <div className="px-4 py-2">
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1">📊 Pozisyon</div>
                        <div className="text-white font-bold text-sm">${positionValue.toFixed(2)}</div>
                    </div>
                    <div className="bg-red-950/30 border border-red-800/20 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1">⚠️ Max Kayıp</div>
                        <div className="text-red-400 font-bold text-sm">${maxLoss.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-950/20 border border-green-800/20 rounded-lg p-2.5">
                        <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-1">💰 Potansiyel Kâr</div>
                        <div className="text-green-400 font-bold text-sm">${potentialProfit1.toFixed(2)} - ${potentialProfit2.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Signal Reasons */}
            <div className="px-4 py-2 pb-3">
                <div className={`rounded-lg p-3 ${isBuy ? 'bg-green-900/10 border border-green-800/20' : 'bg-red-900/10 border border-red-800/20'}`}>
                    <h4 className={`text-xs font-semibold mb-1.5 ${dirColor}`}>✅ Sinyal Sebepleri</h4>
                    <ul className="space-y-0.5">
                        {lastSignal.reasons.map((r, i) => (
                            <li key={i} className="text-gray-400 text-xs flex items-center gap-1.5">
                                <span className="text-gray-600">•</span> {r}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Warning */}
                <div className="mt-2 rounded-lg p-2.5 bg-amber-900/10 border border-amber-800/20">
                    <h4 className="text-xs font-semibold text-amber-400 mb-1">⚠️ Uyarılar</h4>
                    <p className="text-gray-500 text-[10px]">• Risk yönetimi sermayenin %2&apos;si ile hesaplandı</p>
                    <p className="text-gray-500 text-[10px]">• Bu sinyal tavsiye niteliğinde değildir, yatırım kararları sizin sorumluluğunuzdadır</p>
                </div>
            </div>
        </div>
    );
}

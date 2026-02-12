'use client';

import type { LiquidationResult } from '@/shared/types';

interface LiquidationModuleProps {
    symbol: string | null;
    data: LiquidationResult | null;
    loading?: boolean;
}

export default function LiquidationModule({ symbol, data, loading }: LiquidationModuleProps) {
    if (loading) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-24 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-400 mb-4">🔥 Likidasyon Haritası</h3>
                <p className="text-gray-500">Veri bekleniyor...</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    Likidasyon Haritası
                </h3>
                {data.lastUpdate && (
                    <div className="text-xs text-gray-400">
                        📅 {data.lastUpdate}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Mevcut Fiyat</div>
                    <div className="text-white font-bold text-xl">
                        ${data.currentPrice < 1
                            ? data.currentPrice.toFixed(6)
                            : data.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">⬆️</span>
                            <span className="text-gray-400 text-sm">Yukarı Hedef</span>
                        </div>
                        <div className="text-green-500 font-bold text-lg mb-1">
                            ${data.upside.price < 1
                                ? data.upside.price.toFixed(6)
                                : data.upside.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="space-y-1 text-xs text-gray-400">
                            <div>Hacim: ${(data.upside.level / 1000000).toFixed(2)}M</div>
                            {data.upside.leverage && (
                                <div className="text-yellow-400">⚡ Kaldıraç: {data.upside.leverage}x</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">⬇️</span>
                            <span className="text-gray-400 text-sm">Aşağı Hedef</span>
                        </div>
                        <div className="text-red-500 font-bold text-lg mb-1">
                            ${data.downside.price < 1
                                ? data.downside.price.toFixed(6)
                                : data.downside.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="space-y-1 text-xs text-gray-400">
                            <div>Hacim: ${(data.downside.level / 1000000).toFixed(2)}M</div>
                            {data.downside.leverage && (
                                <div className="text-yellow-400">⚡ Kaldıraç: {data.downside.leverage}x</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Embedded Coinglass Heatmap */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-semibold text-white">📊 Liquidation Heatmap</h4>
                        <span className="text-xs text-gray-500">Powered by Coinglass</span>
                    </div>
                    <div className="relative w-full bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700" style={{ height: '500px' }}>
                        <iframe
                            src="https://www.coinglass.com/pro/futures/LiquidationHeatMap"
                            className="w-full h-full"
                            style={{ border: 'none' }}
                            title="Liquidation Heatmap"
                            loading="lazy"
                        />
                        <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-gray-900/80 to-transparent">
                            <p className="text-xs text-gray-400 text-center">
                                💡 Heatmap üzerinde {symbol?.replace('/USDT', '')} coin'ini manuel seçebilirsiniz
                            </p>
                        </div>
                    </div>
                </div>

                {/* Binance Futures Link */}
                {symbol && (
                    <a
                        href={`https://www.binance.com/en/futures/funding-history/perpetual/${symbol.replace('/USDT', '').toLowerCase()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 mt-3 p-3 bg-yellow-900/20 hover:bg-yellow-900/30 border border-yellow-700 rounded-lg transition-all group"
                    >
                        <span className="text-yellow-400 text-sm font-medium">
                            📊 {symbol.replace('/USDT', '')} için Binance Futures verilerine git
                        </span>
                        <svg
                            className="w-4 h-4 text-yellow-400 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                )}


            </div>
        </div>
    );
}

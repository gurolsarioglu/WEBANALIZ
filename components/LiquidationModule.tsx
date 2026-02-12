'use client';

import type { LiquidationResult } from '@/types';

interface LiquidationModuleProps {
    data: LiquidationResult | null;
    loading?: boolean;
}

export default function LiquidationModule({ data, loading }: LiquidationModuleProps) {
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
                <h3 className="text-lg font-semibold text-gray-400 mb-4">5️⃣ Likidasyon Haritası</h3>
                <p className="text-gray-500">Veri bekleniyor...</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">5️⃣ Likidasyon Haritası</h3>
                {data.lastUpdate && (
                    <div className="text-xs text-gray-400">
                        📅 {data.lastUpdate}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="bg-gray-900/50 rounded-lg p-3">
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

                <div className="text-xs text-gray-500 text-center mt-2">
                    💡 Yüksek likidasyon seviyelerinde fiyat tepki gösterebilir
                </div>
            </div>
        </div>
    );
}

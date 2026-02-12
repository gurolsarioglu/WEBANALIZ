'use client';

import type { BTCCorrelationResult } from '@/types';

interface BTCCorrelationModuleProps {
    data: BTCCorrelationResult | null;
    loading?: boolean;
}

export default function BTCCorrelationModule({ data, loading }: BTCCorrelationModuleProps) {
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
                <h3 className="text-lg font-semibold text-gray-400 mb-4">3️⃣ BTC Korelasyon</h3>
                <p className="text-gray-500">Veri bekleniyor...</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">3️⃣ BTC Korelasyon</h3>

            {data.warning && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                    <div className="text-red-500 font-semibold">{data.warning}</div>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-gray-400 text-sm mb-1">BTC Fiyat</div>
                        <div className="text-white font-bold text-lg">${data.btcPrice.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-gray-400 text-sm mb-1">Korelasyon</div>
                        <div className={`font-bold text-lg ${data.correlation === 'ALIGNED' ? 'text-green-500' : 'text-red-500'}`}>
                            {data.correlation === 'ALIGNED' ? '✓ Uyumlu' : '⚠ Ters'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-gray-400 mb-2">Haftalık Trend</div>
                        <div className={`font-semibold ${data.btcTrend.weekly === 'BULLISH' ? 'text-green-500' :
                                data.btcTrend.weekly === 'BEARISH' ? 'text-red-500' : 'text-gray-400'
                            }`}>
                            {data.btcTrend.weekly} {
                                data.btcTrend.weekly === 'BULLISH' ? '🐂' :
                                    data.btcTrend.weekly === 'BEARISH' ? '🐻' : '➖'
                            }
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 mb-2">Günlük Trend</div>
                        <div className={`font-semibold ${data.btcTrend.daily === 'BULLISH' ? 'text-green-500' :
                                data.btcTrend.daily === 'BEARISH' ? 'text-red-500' : 'text-gray-400'
                            }`}>
                            {data.btcTrend.daily} {
                                data.btcTrend.daily === 'BULLISH' ? '🐂' :
                                    data.btcTrend.daily === 'BEARISH' ? '🐻' : '➖'
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

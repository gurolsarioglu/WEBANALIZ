'use client';

import type { BTCCorrelationResult } from '@/shared/types';

interface BTCCorrelationModuleProps {
    data: BTCCorrelationResult | null;
    loading?: boolean;
}

export default function BTCCorrelationModule({ data, loading }: BTCCorrelationModuleProps) {
    if (loading) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-24 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-400 mb-4">🔗 BTC Korelasyonu</h3>
                <p className="text-gray-500">Veri bekleniyor...</p>
            </div>
        );
    }

    const correlationColor = data.correlation === 'ALIGNED' ? 'text-green-500' : 'text-yellow-500';
    const correlationBg = data.correlation === 'ALIGNED' ? 'bg-green-900/20' : 'bg-yellow-900/20';

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                BTC Korelasyonu
            </h3>

            <div className={`${correlationBg} rounded-lg p-4 mb-4 border border-gray-700`}>
                <div className={`text-xl font-bold ${correlationColor} mb-2`}>
                    {data.correlation === 'ALIGNED' ? '✅ Uyumlu' : '⚠️ Uyumsuz'}
                </div>
                {data.warning && (
                    <div className="text-yellow-400 text-sm">{data.warning}</div>
                )}
            </div>

            <div className="space-y-3">
                <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-gray-400 text-sm mb-1">BTC Fiyat</div>
                    <div className="text-white font-semibold text-lg">
                        ${data.btcPrice.toLocaleString()}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Haftalık Trend</div>
                        <div className={`font-semibold ${data.btcTrend.weekly === 'BULLISH' ? 'text-green-500' :
                                data.btcTrend.weekly === 'BEARISH' ? 'text-red-500' : 'text-gray-500'
                            }`}>
                            {data.btcTrend.weekly}
                        </div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                        <div className="text-gray-400 text-xs mb-1">Günlük Trend</div>
                        <div className={`font-semibold ${data.btcTrend.daily === 'BULLISH' ? 'text-green-500' :
                                data.btcTrend.daily === 'BEARISH' ? 'text-red-500' : 'text-gray-500'
                            }`}>
                            {data.btcTrend.daily}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

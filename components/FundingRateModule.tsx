'use client';

import { useState, useEffect } from 'react';
import type { FundingRateResult } from '@/types';

interface FundingRateModuleProps {
    symbol: string | null;
    data: FundingRateResult | null;
    loading?: boolean;
}

export default function FundingRateModule({ symbol, data, loading }: FundingRateModuleProps) {
    const [isTracking, setIsTracking] = useState(false);
    const [liveData, setLiveData] = useState<FundingRateResult | null>(data);

    useEffect(() => {
        setLiveData(data);
    }, [data]);

    useEffect(() => {
        if (!isTracking || !symbol) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/binance/funding-rate?symbol=${encodeURIComponent(symbol)}`);
                const newData = await response.json();
                setLiveData(newData);
            } catch (error) {
                console.error('Error fetching funding rate:', error);
            }
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [isTracking, symbol]);

    if (loading) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-32 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (!liveData) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-400 mb-4">4️⃣ Funding Rate</h3>
                <p className="text-gray-500">Veri bekleniyor...</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">4️⃣ Funding Rate</h3>
                <button
                    onClick={() => setIsTracking(!isTracking)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${isTracking
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                >
                    {isTracking ? '⏸ Durdur' : '▶ Başlat'}
                </button>
            </div>

            <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Anlık FR</div>
                    <div className={`text-2xl font-bold ${liveData.currentRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(liveData.currentRate * 100).toFixed(4)}%
                    </div>
                    {isTracking && (
                        <div className="text-xs text-gray-400 mt-2">🔴 Canlı Takip Aktif</div>
                    )}
                </div>

                {liveData.coinRank && (
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-2">Top Gainers Sıralaması</div>
                        <div className="text-white font-semibold text-lg">#{liveData.coinRank}</div>
                    </div>
                )}

                <div>
                    <div className="text-gray-400 text-sm mb-2">Günün En Çok Yükselenleri (İlk 5)</div>
                    <div className="space-y-1">
                        {liveData.topGainers.slice(0, 5).map((gainer, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-900/50 rounded px-3 py-2 text-sm">
                                <span className="text-gray-300">
                                    {index + 1}. {gainer.symbol}
                                </span>
                                <span className="text-green-500 font-semibold">
                                    +{gainer.priceChangePercent.toFixed(2)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

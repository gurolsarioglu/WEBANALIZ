'use client';

import type { TrendAnalysisResult, TrendData } from '@/shared/types';

interface TrendModuleProps {
    data: TrendAnalysisResult | null;
    loading?: boolean;
}

interface TrendCardProps {
    timeframe: string;
    trendData: TrendData;
}

function TrendCard({ timeframe, trendData }: TrendCardProps) {
    const getBgColor = (trend: string) => {
        if (trend === 'BULLISH') return 'bg-green-900/20 border-green-700';
        if (trend === 'BEARISH') return 'bg-red-900/20 border-red-700';
        return 'bg-gray-900/20 border-gray-700';
    };

    const getTrendColor = (trend: string) => {
        if (trend === 'BULLISH') return 'text-green-500';
        if (trend === 'BEARISH') return 'text-red-500';
        return 'text-gray-500';
    };

    return (
        <div className={`border rounded-lg p-4 ${getBgColor(trendData.trend)}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm font-medium">{timeframe}</span>
                <span className="text-3xl">{trendData.signal}</span>
            </div>
            <div className={`text-center mb-3 font-semibold ${getTrendColor(trendData.trend)}`}>
                {trendData.trend}
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between bg-gray-900/30 rounded p-2">
                    <span className="text-gray-400">MA 50:</span>
                    <span className="text-white">${trendData.ma50 ? trendData.ma50.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between bg-gray-900/30 rounded p-2">
                    <span className="text-gray-400">MA 200:</span>
                    <span className="text-white">${trendData.ma200 ? trendData.ma200.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between bg-gray-900/30 rounded p-2">
                    <span className="text-gray-400">RSI:</span>
                    <span className="text-white">{trendData.rsi ? trendData.rsi.toFixed(2) : 'N/A'}</span>
                </div>
            </div>
        </div>
    );
}

export default function TrendModule({ data, loading }: TrendModuleProps) {
    if (loading) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (!data || !data.weekly || !data.daily) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-400 mb-4">📈 Trend Analizi</h3>
                {!data ? (
                    <p className="text-gray-500">Veri bekleniyor...</p>
                ) : (
                    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                        <p className="text-yellow-400 text-sm">
                            ⚠️ Bu coin için yeterli geçmiş veri bulunamadı. Yeni listelenmiş veya düşük likiditeye sahip olabilir.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Trend Analizi
            </h3>

            <div className="grid grid-cols-2 gap-4">
                <TrendCard timeframe="Haftalık (1W)" trendData={data.weekly} />
                <TrendCard timeframe="Günlük (1D)" trendData={data.daily} />
            </div>
        </div>
    );
}

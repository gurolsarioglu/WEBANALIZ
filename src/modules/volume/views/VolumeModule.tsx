'use client';

import type { VolumeCheckResult } from '@/shared/types';

interface VolumeModuleProps {
    data: VolumeCheckResult | null;
    loading?: boolean;
}

export default function VolumeModule({ data, loading }: VolumeModuleProps) {
    if (loading) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-16 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-400 mb-4">📊 Hacim Kontrolü</h3>
                <p className="text-gray-500">Veri bekleniyor...</p>
            </div>
        );
    }

    const statusColor = data.status === 'success' ? 'text-green-500' : 'text-yellow-500';
    const bgColor = data.status === 'success' ? 'bg-green-900/20' : 'bg-yellow-900/20';

    const getSignalText = (signal: VolumeCheckResult['signal']) => {
        switch (signal) {
            case 'SCALP_READY':
                return '✅ Hacim Uygun';
            case 'VOLUME_LOW':
                return '⚠️ Hacim Yetersiz';
            case 'VOLUME_HIGH':
                return '⚠️ Hacim Yüksek';
        }
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Hacim Kontrolü
            </h3>

            <div className={`${bgColor} rounded-lg p-4 mb-4 border border-gray-700`}>
                <div className={`text-2xl font-bold ${statusColor} mb-2`}>
                    {getSignalText(data.signal)}
                </div>
                <div className="text-gray-400 text-sm">
                    Hacim Değişimi: <span className={statusColor}>{data.volumeChangePercent.toFixed(2)}%</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-gray-400 mb-1">Mevcut 24h Hacim</div>
                    <div className="text-white font-semibold text-lg">
                        ${(data.current24hVolume / 1000000).toFixed(2)}M
                    </div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-gray-400 mb-1">Önceki 24h Hacim</div>
                    <div className="text-white font-semibold text-lg">
                        ${(data.previous24hVolume / 1000000).toFixed(2)}M
                    </div>
                </div>
            </div>
        </div>
    );
}

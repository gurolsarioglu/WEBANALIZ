'use client';

import type { TradingSignal, SignalType } from '../models/SignalAggregatorModel';

interface SignalCardProps {
    symbol: string | null;
    data: TradingSignal | null;
    loading?: boolean;
}

export default function SignalCard({ symbol, data, loading }: SignalCardProps) {
    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-xl p-8 animate-pulse">
                <div className="h-12 bg-gray-700 rounded w-2/3 mb-6"></div>
                <div className="h-32 bg-gray-700 rounded"></div>
            </div>
        );
    }

    if (!data || !symbol) {
        return (
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-4">🎯 Trading Sinyali</h2>
                <p className="text-gray-400">Bir coin analiz edin...</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-yellow-600/50 rounded-xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        🎯 Trading Sinyali
                        <span className="text-lg text-gray-400">{symbol.replace('/USDT', '')}</span>
                    </h2>
                </div>
                <SignalBadge signal={data.signal} confidence={data.confidence} />
            </div>

            {/* Main Signal & Confidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <ActionCard signal={data.signal} />
                <ConfidenceCard confidence={data.confidence} />
            </div>

            {/* Price Levels */}
            <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    💰 Fiyat Seviyeleri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <PriceLevel
                        label="Giriş"
                        price={data.entry}
                        icon="📍"
                        variant="entry"
                    />
                    <PriceLevel
                        label="Stop Loss"
                        price={data.stopLoss}
                        icon="🛑"
                        variant="stop"
                        percent={((data.stopLoss - data.entry) / data.entry * 100).toFixed(2)}
                    />
                    <PriceLevel
                        label="TP1"
                        price={data.takeProfits[0]}
                        icon="🎯"
                        variant="profit"
                        percent={((data.takeProfits[0] - data.entry) / data.entry * 100).toFixed(2)}
                        rr={data.riskRewardRatios[0]}
                    />
                    <PriceLevel
                        label="TP2"
                        price={data.takeProfits[1]}
                        icon="💎"
                        variant="profit"
                        percent={((data.takeProfits[1] - data.entry) / data.entry * 100).toFixed(2)}
                        rr={data.riskRewardRatios[1]}
                    />
                </div>
            </div>

            {/* Risk Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <RiskMetric
                    label="Position Size"
                    value={`$${data.positionSize.toFixed(2)}`}
                    icon="💵"
                />
                <RiskMetric
                    label="Max Loss"
                    value={`$${Math.abs(data.riskMetrics.maxLoss).toFixed(2)}`}
                    icon="⚠️"
                    variant="danger"
                />
                <RiskMetric
                    label="Potential Profit"
                    value={`$${data.riskMetrics.potentialProfits[0]?.toFixed(2) || '0'}`}
                    icon="💰"
                    variant="success"
                />
            </div>

            {/* Reasons */}
            <div className="bg-green-900/20 border border-green-700 rounded-lg p-5 mb-4">
                <h4 className="text-md font-semibold text-green-400 mb-3 flex items-center gap-2">
                    ✅ Sinyal Sebepleri
                </h4>
                <ul className="space-y-2">
                    {data.reasons.map((reason, index) => (
                        <li key={index} className="text-green-300 text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{reason}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Warnings */}
            {data.warnings.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-5">
                    <h4 className="text-md font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                        ⚠️ Uyarılar
                    </h4>
                    <ul className="space-y-2">
                        {data.warnings.map((warning, index) => (
                            <li key={index} className="text-yellow-300 text-sm flex items-start gap-2">
                                <span className="text-yellow-500 mt-0.5">•</span>
                                <span>{warning}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Disclaimer */}
            <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-xs text-gray-500 text-center">
                    ⚠️ Bu sinyal eğitim amaçlıdır. Yatırım kararlarınızı kendi araştırmanıza dayandırın.
                    Geçmiş performans gelecek kazançları garanti etmez.
                </p>
            </div>
        </div>
    );
}

// Sub-components
function SignalBadge({ signal, confidence }: { signal: SignalType; confidence: number }) {
    const config = {
        STRONG_BUY: { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-400', label: 'GÜÇLÜ ALIM' },
        BUY: { bg: 'bg-green-900/30', border: 'border-green-600', text: 'text-green-400', label: 'ALIM' },
        HOLD: { bg: 'bg-gray-900/50', border: 'border-gray-500', text: 'text-gray-400', label: 'BEKLE' },
        SELL: { bg: 'bg-red-900/30', border: 'border-red-600', text: 'text-red-400', label: 'SATIM' },
        STRONG_SELL: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-400', label: 'GÜÇLÜ SATIM' },
    };

    const style = config[signal];

    return (
        <div className={`${style.bg} border-2 ${style.border} rounded-lg px-6 py-3`}>
            <div className={`text-2xl font-bold ${style.text}`}>{style.label}</div>
            <div className="text-sm text-gray-400 mt-1">Güven: {confidence}%</div>
        </div>
    );
}

function ActionCard({ signal }: { signal: SignalType }) {
    const isBuy = signal.includes('BUY');
    const isSell = signal.includes('SELL');

    return (
        <div className={`rounded-lg p-6 ${isBuy ? 'bg-green-900/20 border-2 border-green-700' : isSell ? 'bg-red-900/20 border-2 border-red-700' : 'bg-gray-900/20 border-2 border-gray-700'}`}>
            <div className="text-6xl mb-3">{isBuy ? '📈' : isSell ? '📉' : '⏸️'}</div>
            <div className={`text-2xl font-bold ${isBuy ? 'text-green-400' : isSell ? 'text-red-400' : 'text-gray-400'}`}>
                {isBuy ? 'AL' : isSell ? 'SAT' : 'BEKLE'}
            </div>
            <div className="text-sm text-gray-400 mt-2">
                {isBuy ? 'Alım fırsatı' : isSell ? 'Satım zamanı' : 'Beklemede kal'}
            </div>
        </div>
    );
}

function ConfidenceCard({ confidence }: { confidence: number }) {
    const getColor = () => {
        if (confidence >= 75) return 'bg-green-500';
        if (confidence >= 60) return 'bg-green-600';
        if (confidence >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-gray-900/20 border-2 border-gray-700 rounded-lg p-6">
            <div className="text-sm text-gray-400 mb-3">Güven Skoru</div>
            <div className="text-5xl font-bold text-white mb-4">{confidence}%</div>
            <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                    className={`${getColor()} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${confidence}%` }}
                ></div>
            </div>
        </div>
    );
}

function PriceLevel({
    label,
    price,
    icon,
    variant,
    percent,
    rr,
}: {
    label: string;
    price: number;
    icon: string;
    variant: 'entry' | 'stop' | 'profit';
    percent?: string;
    rr?: number;
}) {
    const styles = {
        entry: 'bg-blue-900/20 border-blue-700',
        stop: 'bg-red-900/20 border-red-700',
        profit: 'bg-green-900/20 border-green-700',
    };

    return (
        <div className={`${styles[variant]} border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-gray-400 text-sm font-medium">{label}</span>
            </div>
            <div className="text-white font-bold text-lg">${price.toFixed(2)}</div>
            {percent && (
                <div className={`text-sm mt-1 ${variant === 'stop' ? 'text-red-400' : 'text-green-400'}`}>
                    {percent}%
                </div>
            )}
            {rr && (
                <div className="text-xs text-gray-500 mt-1">R/R: 1:{rr}</div>
            )}
        </div>
    );
}

function RiskMetric({
    label,
    value,
    icon,
    variant,
}: {
    label: string;
    value: string;
    icon: string;
    variant?: 'success' | 'danger';
}) {
    const variantStyles = variant === 'success'
        ? 'bg-green-900/20 border-green-700'
        : variant === 'danger'
            ? 'bg-red-900/20 border-red-700'
            : 'bg-gray-900/20 border-gray-700';

    return (
        <div className={`${variantStyles} border rounded-lg p-4`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-gray-400 text-sm">{label}</span>
            </div>
            <div className="text-white font-bold text-xl">{value}</div>
        </div>
    );
}

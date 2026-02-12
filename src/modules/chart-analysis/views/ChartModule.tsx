'use client';

import { useState, useRef, useCallback } from 'react';
import CandlestickChart, { type ChartData } from './CandlestickChart';
import TradingInfoPanel from './TradingInfoPanel';

interface Props {
    symbol: string;
}

const TIMEFRAMES = ['5m', '15m', '1h', '4h', '1d'] as const;
const TF_LABELS: Record<string, string> = { '5m': '5D', '15m': '15D', '1h': '1S', '4h': '4S', '1d': '1G' };

interface PanelWidth { [tf: string]: number; }

export default function ChartModule({ symbol }: Props) {
    const [selectedTF, setSelectedTF] = useState<string>('5m');
    const [showMultiChart, setShowMultiChart] = useState(false);
    const [capital, setCapitalInput] = useState('1000');
    const [chartData, setChartData] = useState<ChartData | null>(null);

    const capitalNum = parseFloat(capital) || 1000;

    // Resizable panel widths
    const [panelWidths, setPanelWidths] = useState<PanelWidth>(() => {
        const w: PanelWidth = {};
        TIMEFRAMES.forEach(tf => { w[tf] = 100 / TIMEFRAMES.length; });
        return w;
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const draggingIdx = useRef<number | null>(null);
    const startX = useRef(0);
    const startWidths = useRef<PanelWidth>({});

    const onMouseDown = useCallback((idx: number, e: React.MouseEvent) => {
        e.preventDefault();
        draggingIdx.current = idx;
        startX.current = e.clientX;
        startWidths.current = { ...panelWidths };

        const onMouseMove = (ev: MouseEvent) => {
            if (draggingIdx.current === null || !containerRef.current) return;
            const containerW = containerRef.current.clientWidth;
            const dx = ev.clientX - startX.current;
            const dxPercent = (dx / containerW) * 100;

            const leftTF = TIMEFRAMES[draggingIdx.current];
            const rightTF = TIMEFRAMES[draggingIdx.current + 1];

            const newLeftW = Math.max(10, (startWidths.current[leftTF] || 20) + dxPercent);
            const newRightW = Math.max(10, (startWidths.current[rightTF] || 20) - dxPercent);

            setPanelWidths(prev => ({ ...prev, [leftTF]: newLeftW, [rightTF]: newRightW }));
        };

        const onMouseUp = () => {
            draggingIdx.current = null;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [panelWidths]);

    const handleDataLoaded = useCallback((data: ChartData) => {
        setChartData(data);
    }, []);

    return (
        <div className="space-y-3">
            {/* Controls Bar */}
            <div className="bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-700/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Timeframe buttons */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400 text-xs font-medium mr-1">⏱</span>
                        {TIMEFRAMES.map(tf => (
                            <button
                                key={tf}
                                onClick={() => { setSelectedTF(tf); setShowMultiChart(false); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedTF === tf && !showMultiChart
                                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg shadow-yellow-500/20'
                                        : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 hover:text-gray-200 border border-gray-700/30'
                                    }`}
                            >
                                {TF_LABELS[tf]}
                            </button>
                        ))}
                    </div>

                    {/* Capital */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">💰</span>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                            <input
                                type="number"
                                value={capital}
                                onChange={(e) => setCapitalInput(e.target.value)}
                                className="bg-gray-800/80 border border-gray-700/50 rounded-lg pl-6 pr-3 py-1.5 text-xs text-white w-24 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20"
                                min={1}
                            />
                        </div>
                    </div>

                    {/* Multi-chart toggle */}
                    <button
                        onClick={() => setShowMultiChart(!showMultiChart)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${showMultiChart
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-700/30'
                            }`}
                    >
                        📺 Çoklu Grafik
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            {showMultiChart ? (
                <div className="space-y-2">
                    <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-800/30 rounded-lg px-3 py-2">
                        <h2 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                            📺 Multi-Timeframe Panel
                            <span className="text-xs font-normal text-gray-400">· {symbol}</span>
                            <span className="text-[10px] text-gray-500 ml-auto">← sürükleyerek genişlik ayarla →</span>
                        </h2>
                    </div>

                    {/* Horizontal resizable panels */}
                    <div
                        ref={containerRef}
                        className="flex rounded-xl overflow-hidden border border-gray-800"
                        style={{ minHeight: 480 }}
                    >
                        {TIMEFRAMES.map((tf, idx) => (
                            <div key={tf} className="flex" style={{ width: `${panelWidths[tf]}%`, minWidth: 0 }}>
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <CandlestickChart symbol={symbol} timeframe={tf} compact={true} />
                                </div>
                                {idx < TIMEFRAMES.length - 1 && (
                                    <div
                                        className="w-1.5 bg-gray-800 hover:bg-cyan-600 cursor-col-resize flex items-center justify-center transition-colors group flex-shrink-0"
                                        onMouseDown={(e) => onMouseDown(idx, e)}
                                    >
                                        <div className="w-0.5 h-8 bg-gray-600 group-hover:bg-cyan-400 rounded transition-colors" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <CandlestickChart symbol={symbol} timeframe={selectedTF} compact={false} onDataLoaded={handleDataLoaded} />
            )}

            {/* Trading Info Panel - Below Charts */}
            <TradingInfoPanel data={chartData} capital={capitalNum} symbol={symbol} />
        </div>
    );
}

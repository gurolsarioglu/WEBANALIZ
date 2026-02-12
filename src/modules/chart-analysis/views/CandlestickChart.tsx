'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    createChart,
    CandlestickSeries,
    LineSeries,
    type IChartApi,
    type ISeriesApi,
    ColorType,
    type Time,
    LineStyle,
} from 'lightweight-charts';

interface ChartData {
    candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
    indicators: {
        dema: { time: number; value: number }[];
        mavilim: { time: number; value: number; color: string }[];
        nadarayaUpper: { time: number; value: number }[];
        nadarayaLower: { time: number; value: number }[];
        pmax: { time: number; value: number; color: string }[];
        rsi: { time: number; value: number }[];
        srsiK: { time: number; value: number }[];
        srsiD: { time: number; value: number }[];
        ichimokuTenkan: { time: number; value: number }[];
        ichimokuKijun: { time: number; value: number }[];
        wt1: { time: number; value: number }[];
        wt2: { time: number; value: number }[];
        linregMiddle: { time: number; value: number }[];
        linregUpper: { time: number; value: number }[];
        linregLower: { time: number; value: number }[];
    };
    signals: { time: number; price: number; type: 'BUY' | 'SELL'; strength: number; reasons: string[] }[];
}

export type { ChartData };

interface Props {
    symbol: string;
    timeframe: string;
    compact?: boolean;
    onDataLoaded?: (data: ChartData) => void;
}

const TF_LABELS: Record<string, string> = {
    '5m': '5 Dakika', '15m': '15 Dakika', '1h': '1 Saat', '4h': '4 Saat', '1d': '1 Gün',
};

function addLine(chart: IChartApi, data: { time: number; value: number }[], opts: { color: string; lineWidth?: 1 | 2 | 3 | 4; lineStyle?: LineStyle; title?: string }) {
    if (data.length === 0) return;
    const s = chart.addSeries(LineSeries, {
        color: opts.color, lineWidth: opts.lineWidth || 1, lineStyle: opts.lineStyle,
        title: opts.title, lastValueVisible: !!opts.title, priceLineVisible: false,
    });
    s.setData(data.map(d => ({ time: d.time as Time, value: d.value })));
}

function addColorLine(chart: IChartApi, data: { time: number; value: number; color: string }[], opts: { lineWidth?: 1 | 2 | 3 | 4; title?: string }) {
    if (data.length === 0) return;
    const s = chart.addSeries(LineSeries, {
        color: '#888', lineWidth: opts.lineWidth || 2,
        title: opts.title, lastValueVisible: !!opts.title, priceLineVisible: false,
    });
    s.setData(data.map(d => ({ time: d.time as Time, value: d.value, color: d.color })));
}

export default function CandlestickChart({ symbol, timeframe, compact = false, onDataLoaded }: Props) {
    const mainRef = useRef<HTMLDivElement>(null);
    const rsiRef = useRef<HTMLDivElement>(null);
    const srsiRef = useRef<HTMLDivElement>(null);
    const wtRef = useRef<HTMLDivElement>(null);
    const ichiRef = useRef<HTMLDivElement>(null);

    const charts = useRef<IChartApi[]>([]);
    const wsRef = useRef<WebSocket | null>(null);
    const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    const [data, setData] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);

    // Use ref for callback to avoid re-render loops
    const onDataLoadedRef = useRef(onDataLoaded);
    onDataLoadedRef.current = onDataLoaded;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/chart/data?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=300`);
            const json = await res.json();
            if (json.candles) {
                setData(json);
                onDataLoadedRef.current?.(json);
            }
        } catch (err) { console.error('Chart fetch error:', err); }
        finally { setLoading(false); }
    }, [symbol, timeframe]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const destroyCharts = useCallback(() => {
        charts.current.forEach(c => { try { c.remove(); } catch { } });
        charts.current = [];
        candleRef.current = null;
    }, []);

    // Build charts
    useEffect(() => {
        if (!data || !mainRef.current) return;
        destroyCharts();

        const mainH = compact ? 220 : 400;
        const subH = compact ? 55 : 100;

        const chartOpts = (container: HTMLDivElement, height: number, showTime = false) => ({
            width: container.clientWidth,
            height,
            layout: { background: { type: ColorType.Solid as const, color: '#0a0a0a' }, textColor: '#9ca3af', fontSize: compact ? 8 : 11 },
            grid: { vertLines: { color: '#1a1a2e' }, horzLines: { color: '#1a1a2e' } },
            crosshair: { mode: 0 as const },
            rightPriceScale: { borderColor: '#2d2d44', scaleMargins: { top: 0.05, bottom: 0.05 } },
            timeScale: { borderColor: '#2d2d44', timeVisible: true, secondsVisible: false, visible: showTime },
        });

        // === MAIN CHART ===
        const main = createChart(mainRef.current, chartOpts(mainRef.current, mainH));
        charts.current.push(main);

        const candle = main.addSeries(CandlestickSeries, {
            upColor: '#22c55e', downColor: '#ef4444',
            borderUpColor: '#22c55e', borderDownColor: '#ef4444',
            wickUpColor: '#22c55e', wickDownColor: '#ef4444',
        });
        candle.setData(data.candles.map(c => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close })));
        candleRef.current = candle;

        // Overlays
        addLine(main, data.indicators.dema, { color: '#eab308', lineWidth: 1, title: compact ? '' : 'DEMA9' });
        addColorLine(main, data.indicators.mavilim, { lineWidth: 2, title: compact ? '' : 'Mavilim' });
        addLine(main, data.indicators.nadarayaUpper, { color: '#a855f7', lineWidth: 1, lineStyle: LineStyle.Dashed, title: compact ? '' : 'NW↑' });
        addLine(main, data.indicators.nadarayaLower, { color: '#a855f7', lineWidth: 1, lineStyle: LineStyle.Dashed, title: compact ? '' : 'NW↓' });
        addColorLine(main, data.indicators.pmax, { lineWidth: 2, title: compact ? '' : 'PMAX' });

        // LinReg Band
        addLine(main, data.indicators.linregMiddle, { color: '#06b6d4', lineWidth: 1, title: compact ? '' : 'LinReg' });
        addLine(main, data.indicators.linregUpper, { color: '#06b6d4', lineWidth: 1, lineStyle: LineStyle.Dashed });
        addLine(main, data.indicators.linregLower, { color: '#06b6d4', lineWidth: 1, lineStyle: LineStyle.Dashed });

        // BUY/SELL markers
        const buys = data.signals.filter(s => s.type === 'BUY');
        const sells = data.signals.filter(s => s.type === 'SELL');
        if (buys.length > 0) {
            const bs = main.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1, pointMarkersVisible: true, pointMarkersRadius: compact ? 3 : 5, title: '', lastValueVisible: false, priceLineVisible: false });
            bs.setData(buys.map(s => ({ time: s.time as Time, value: s.price * 0.997 })));
        }
        if (sells.length > 0) {
            const ss = main.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, pointMarkersVisible: true, pointMarkersRadius: compact ? 3 : 5, title: '', lastValueVisible: false, priceLineVisible: false });
            ss.setData(sells.map(s => ({ time: s.time as Time, value: s.price * 1.003 })));
        }

        main.timeScale().fitContent();

        // Sub-panels helper
        const buildSubPanel = (ref: React.RefObject<HTMLDivElement | null>, height: number, showTime: boolean, builder: (chart: IChartApi) => void) => {
            if (!ref.current) return;
            const chart = createChart(ref.current, chartOpts(ref.current, height, showTime));
            charts.current.push(chart);
            builder(chart);
            chart.timeScale().fitContent();
        };

        // === RSI ===
        buildSubPanel(rsiRef, subH, false, (chart) => {
            addLine(chart, data.indicators.rsi, { color: '#f59e0b', lineWidth: compact ? 1 : 2, title: compact ? '' : 'RSI' });
            if (data.indicators.rsi.length > 0) {
                const t = data.indicators.rsi.map(d => d.time);
                addLine(chart, t.map(time => ({ time, value: 70 })), { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed });
                addLine(chart, t.map(time => ({ time, value: 30 })), { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed });
            }
        });

        // === SRSI ===
        buildSubPanel(srsiRef, subH, false, (chart) => {
            addLine(chart, data.indicators.srsiK, { color: '#3b82f6', lineWidth: compact ? 1 : 2, title: compact ? '' : 'K' });
            addLine(chart, data.indicators.srsiD, { color: '#f97316', lineWidth: 1, title: compact ? '' : 'D' });
            const t = (data.indicators.srsiK.length > 0 ? data.indicators.srsiK : data.indicators.srsiD).map(d => d.time);
            if (t.length > 0) {
                addLine(chart, t.map(time => ({ time, value: 80 })), { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed });
                addLine(chart, t.map(time => ({ time, value: 20 })), { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed });
            }
        });

        // === WTCROSS ===
        buildSubPanel(wtRef, subH, false, (chart) => {
            addLine(chart, data.indicators.wt1, { color: '#22d3ee', lineWidth: compact ? 1 : 2, title: compact ? '' : 'WT1' });
            addLine(chart, data.indicators.wt2, { color: '#f472b6', lineWidth: 1, title: compact ? '' : 'WT2' });
            const t = (data.indicators.wt1.length > 0 ? data.indicators.wt1 : data.indicators.wt2).map(d => d.time);
            if (t.length > 0) {
                addLine(chart, t.map(time => ({ time, value: 60 })), { color: '#ef4444', lineWidth: 1, lineStyle: LineStyle.Dashed });
                addLine(chart, t.map(time => ({ time, value: -60 })), { color: '#22c55e', lineWidth: 1, lineStyle: LineStyle.Dashed });
                addLine(chart, t.map(time => ({ time, value: 0 })), { color: '#4b5563', lineWidth: 1, lineStyle: LineStyle.Dashed });
            }
        });

        // === ICHIMOKU ===
        buildSubPanel(ichiRef, subH, true, (chart) => {
            addLine(chart, data.indicators.ichimokuTenkan, { color: '#2dd4bf', lineWidth: compact ? 1 : 2, title: compact ? '' : 'Tenkan' });
            addLine(chart, data.indicators.ichimokuKijun, { color: '#f87171', lineWidth: compact ? 1 : 2, title: compact ? '' : 'Kijun' });
        });

        // Global resize
        const allRefs = [mainRef, rsiRef, srsiRef, wtRef, ichiRef];
        const handleResize = () => {
            charts.current.forEach((c, i) => {
                const el = allRefs[i]?.current;
                if (el) c.applyOptions({ width: el.clientWidth });
            });
        };
        window.addEventListener('resize', handleResize);
        return () => { window.removeEventListener('resize', handleResize); destroyCharts(); };
    }, [data, compact, destroyCharts]);

    // WebSocket
    useEffect(() => {
        if (!data) return;
        const wsSymbol = symbol.replace('/', '').toLowerCase();
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${wsSymbol}@kline_${timeframe}`);
        wsRef.current = ws;
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => setWsConnected(false);
        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.k && candleRef.current) {
                    candleRef.current.update({
                        time: Math.floor(msg.k.t / 1000) as Time,
                        open: parseFloat(msg.k.o), high: parseFloat(msg.k.h),
                        low: parseFloat(msg.k.l), close: parseFloat(msg.k.c),
                    });
                }
            } catch { }
        };
        return () => { ws.close(); wsRef.current = null; };
    }, [data, symbol, timeframe]);

    const recentSignals = data?.signals?.slice(-5).reverse() || [];

    if (loading) {
        return (
            <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 flex items-center justify-center" style={{ minHeight: compact ? 280 : 500 }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                <span className="ml-3 text-gray-400 text-sm">Grafik yükleniyor...</span>
            </div>
        );
    }

    // Sub-panel label component
    const SubLabel = ({ text, color }: { text: string; color: string }) => (
        <div className={`px-2 py-0.5 text-[${compact ? '8px' : '10px'}] bg-black/30 font-semibold`} style={{ color }}>{text}</div>
    );

    return (
        <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-hidden flex flex-col">
            {/* Header */}
            <div className={`flex items-center justify-between border-b border-gray-800 ${compact ? 'px-2 py-1' : 'px-4 py-2'}`}>
                <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-white ${compact ? 'text-[10px]' : 'text-sm'}`}>
                        {compact ? TF_LABELS[timeframe] : `📊 ${symbol} · ${TF_LABELS[timeframe]}`}
                    </h3>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-bold ${wsConnected ? 'bg-green-900/60 text-green-400' : 'bg-red-900/60 text-red-400'}`}>
                        {wsConnected ? '●' : '○'}
                    </span>
                </div>
                {!compact && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500">
                        <span>🟡DEMA9</span><span>🔵Mavilim</span><span>🟣NW</span><span>🟢PMAX</span><span className="text-cyan-400">LinReg</span>
                    </div>
                )}
            </div>

            {/* Main Chart */}
            <div ref={mainRef} />

            {/* Sub Panels - ALWAYS visible */}
            <div className="border-t border-gray-800/50">
                {!compact && <SubLabel text="RSI(14)" color="#f59e0b99" />}
                <div ref={rsiRef} />
            </div>
            <div className="border-t border-gray-800/50">
                {!compact && <SubLabel text="Stochastic RSI" color="#3b82f699" />}
                <div ref={srsiRef} />
            </div>
            <div className="border-t border-gray-800/50">
                {!compact && <SubLabel text="WaveTrend Cross" color="#22d3ee99" />}
                <div ref={wtRef} />
            </div>
            <div className="border-t border-gray-800/50">
                {!compact && <SubLabel text="Ichimoku (TK)" color="#2dd4bf99" />}
                <div ref={ichiRef} />
            </div>

            {/* Recent Signals - full view only */}
            {!compact && recentSignals.length > 0 && (
                <div className="border-t border-gray-800 p-3">
                    <h4 className="text-xs font-semibold text-gray-400 mb-1.5">🎯 Son Sinyaller</h4>
                    <div className="space-y-1">
                        {recentSignals.map((sig, i) => (
                            <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${sig.type === 'BUY' ? 'bg-green-900/15 border border-green-800/20' : 'bg-red-900/15 border border-red-800/20'}`}>
                                <span>{sig.type === 'BUY' ? '📈' : '📉'}</span>
                                <span className={`font-bold ${sig.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{sig.type === 'BUY' ? 'AL' : 'SAT'}</span>
                                <span className="text-gray-500">{'⭐'.repeat(sig.strength)}</span>
                                <span className="text-gray-500 text-[10px] flex-1 truncate">{sig.reasons.join(' · ')}</span>
                                <span className="text-gray-300 font-mono">${sig.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

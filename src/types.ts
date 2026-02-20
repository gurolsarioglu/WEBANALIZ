/** Candle data from Binance */
export interface CandleData {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/** Trade direction */
export type TradeDirection = 'LONG' | 'SHORT';

/** Risk level */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';

/** Single timeframe data */
export interface TimeframeData {
    timeframe: string;
    rsi: number;
    srsiK: number;
    srsiD: number;
    wtCrossSignal: 'buy' | 'sell' | 'neutral';
    wt1: number;
    wt2: number;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    close: number;
    volumeChangePct: number;
    rsiCross: 'bullish_cross' | 'bearish_cross' | 'none';
    srsiCross: 'bullish_cross' | 'bearish_cross' | 'none';
    accumulation: {
        count: number;       // Kaç mum aşırı bölgede
        zone: 'OVERBOUGHT' | 'OVERSOLD' | 'NONE';
        peakRSI: number;
        stochCross: boolean; // K/D bölgede kesişti mi
    };
}

/** Multi-timeframe data */
export interface MultiTimeframeData {
    entry: { '5m': TimeframeData; '15m': TimeframeData };
    direction: { '1h': TimeframeData; '4h': TimeframeData; '1d': TimeframeData };
}

/** FR assessment */
export interface FRAssessment {
    rate: number;
    ratePct: number;
    riskLevel: RiskLevel;
    allowLong: boolean;
    allowShort: boolean;
    lsRatio: number;
}

/** Profit calculation */
export interface ProfitCalc {
    entryPrice: number;
    targetPrice: number;
    entryUSD: number;
    leveragedUSD: number;
    profitUSD: number;
    profitPct: number;
}

/** Trade signal */
export interface TradeSignal {
    timestamp: number;
    symbol: string;
    direction: TradeDirection;
    status: 'ACTIVE' | 'WARNING' | 'BLOCKED';
    entryPrice: number;
    targetPrice: number;
    profit: ProfitCalc;
    multiTF: MultiTimeframeData;
    fr: FRAssessment;
    strength: number;
    reasons: string[];
    warnings: string[];
}

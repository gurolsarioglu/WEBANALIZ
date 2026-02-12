// Type definitions for the Crypto Scalp Analyzer

export interface CoinAnalysis {
  symbol: string;
  timestamp: number;
  volumeCheck: VolumeCheckResult;
  trendAnalysis: TrendAnalysisResult;
  btcCorrelation: BTCCorrelationResult;
  fundingRate: FundingRateResult;
  liquidation: LiquidationResult;
}

export interface VolumeCheckResult {
  current24hVolume: number;
  previous24hVolume: number;
  volumeChangePercent: number;
  signal: 'SCALP_READY' | 'VOLUME_LOW' | 'VOLUME_HIGH';
  status: 'success' | 'warning' | 'error';
}

export interface TrendAnalysisResult {
  weekly: TrendData;
  daily: TrendData;
}

export interface TrendData {
  timeframe: '1W' | '1D';
  ma50: number;
  ma200: number;
  rsi: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signal: '🐂' | '🐻' | '➖';
}

export interface BTCCorrelationResult {
  btcPrice: number;
  btcTrend: {
    weekly: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    daily: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  btcVolume: number;
  correlation: 'ALIGNED' | 'DIVERGENT';
  warning?: string;
}

export interface FundingRateResult {
  currentRate: number;
  timestamp: number;
  history: FundingRateHistory[];
  topGainers: TopGainer[];
  coinRank?: number;
}

export interface FundingRateHistory {
  timestamp: number;
  rate: number;
}

export interface TopGainer {
  symbol: string;
  priceChangePercent: number;
  rank: number;
}

export interface LiquidationResult {
  upside: {
    price: number;
    level: number;
    leverage?: number;
  };
  downside: {
    price: number;
    level: number;
    leverage?: number;
  };
  currentPrice: number;
  timestamp?: number;
  lastUpdate?: string;
}

export interface BinanceKlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteVolume: string;
  trades: number;
  takerBuyBaseVolume: string;
  takerBuyQuoteVolume: string;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

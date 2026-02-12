/**
 * Application Configuration and Constants
 */

// API Configuration
export const API_CONFIG = {
    BINANCE: {
        BASE_URL: 'https://fapi.binance.com',
        DEFAULT_TYPE: 'future' as const,
        RATE_LIMIT: true,
    },
    COINGLASS: {
        BASE_URL: 'https://open-api.coinglass.com/public/v2',
        TIMEOUT: 10000,
    },
} as const;

// Timeframe Configuration
export const TIMEFRAMES = {
    ONE_MINUTE: '1m',
    FIVE_MINUTES: '5m',
    FIFTEEN_MINUTES: '15m',
    ONE_HOUR: '1h',
    FOUR_HOURS: '4h',
    ONE_DAY: '1d',
    ONE_WEEK: '1w',
} as const;

// Technical Indicator Periods
export const INDICATOR_PERIODS = {
    RSI: 14,
    MA_SHORT: 50,
    MA_LONG: 200,
    VOLUME_LOOKBACK: 100,
} as const;

// Volume Analysis Thresholds
export const VOLUME_THRESHOLDS = {
    MIN_CHANGE: 10, // Minimum volume change % for SCALP_READY
    MAX_CHANGE: 20, // Maximum volume change % for SCALP_READY
    LOW_THRESHOLD: 10, // Below this is VOLUME_LOW
    HIGH_THRESHOLD: 20, // Above this is VOLUME_HIGH
} as const;

// RSI Thresholds
export const RSI_THRESHOLDS = {
    OVERSOLD: 30,
    OVERBOUGHT: 70,
    NEUTRAL_LOW: 40,
    NEUTRAL_HIGH: 60,
} as const;

// Trend Detection
export const TREND_CONFIG = {
    BULLISH_RSI_MIN: 50,
    BEARISH_RSI_MAX: 50,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
    VOLUME_CHECK: '/api/analysis/volume-check',
    TREND_ANALYSIS: '/api/analysis/trend-analysis',
    BTC_CORRELATION: '/api/analysis/btc-correlation',
    FUNDING_RATE: '/api/binance/funding-rate',
    LIQUIDATION: '/api/coinglass/liquidation',
} as const;

// Module Configuration
export const MODULES = {
    VOLUME: {
        ID: 'volume',
        NAME: 'Volume Analysis',
        EMOJI: '📊',
        ORDER: 1,
    },
    TREND: {
        ID: 'trend',
        NAME: 'Trend Analysis',
        EMOJI: '📈',
        ORDER: 2,
    },
    BTC_CORRELATION: {
        ID: 'btc-correlation',
        NAME: 'BTC Correlation',
        EMOJI: '🔗',
        ORDER: 3,
    },
    FUNDING_RATE: {
        ID: 'funding-rate',
        NAME: 'Funding Rate',
        EMOJI: '💰',
        ORDER: 4,
    },
    LIQUIDATION: {
        ID: 'liquidation',
        NAME: 'Liquidation Map',
        EMOJI: '🔥',
        ORDER: 5,
    },
} as const;

// Default symbols
export const DEFAULT_SYMBOLS = {
    BTC: 'BTC/USDT',
    ETH: 'ETH/USDT',
    BASE_QUOTE: 'USDT',
} as const;

// Cache Configuration (for future implementation)
export const CACHE_CONFIG = {
    OHLCV_TTL: 60000, // 1 minute
    TICKER_TTL: 5000, // 5 seconds
    FUNDING_RATE_TTL: 300000, // 5 minutes
    LIQUIDATION_TTL: 60000, // 1 minute
} as const;

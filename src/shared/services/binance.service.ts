import ccxt from 'ccxt';
import { API_CONFIG } from '@/shared/config/constants';
import type { CandleData } from '@/shared/types';

// Binance client singleton
let binanceInstance: InstanceType<typeof ccxt.binance> | null = null;

/**
 * Get or create Binance client instance
 */
export function getBinanceClient(): InstanceType<typeof ccxt.binance> {
    if (!binanceInstance) {
        binanceInstance = new ccxt.binance({
            enableRateLimit: API_CONFIG.BINANCE.RATE_LIMIT,
            options: {
                defaultType: API_CONFIG.BINANCE.DEFAULT_TYPE,
            },
        });
    }
    return binanceInstance;
}

/**
 * Fetch OHLCV data from Binance
 * @param symbol - Trading pair (e.g., 'BTC/USDT')
 * @param timeframe - Candle timeframe ('1d', '1w', etc.)
 * @param limit - Number of candles to fetch
 */
export async function fetchOHLCV(
    symbol: string,
    timeframe: string = '1d',
    limit: number = 100
): Promise<CandleData[]> {
    const client = getBinanceClient();
    try {
        const ohlcv = await client.fetchOHLCV(symbol, timeframe, undefined, limit);
        return ohlcv.map(candle => ({
            timestamp: candle[0] as number,
            open: candle[1] as number,
            high: candle[2] as number,
            low: candle[3] as number,
            close: candle[4] as number,
            volume: candle[5] as number,
        }));
    } catch (error) {
        console.error(`Error fetching OHLCV for ${symbol}:`, error);
        throw new Error(`Failed to fetch OHLCV data for ${symbol}`);
    }
}

/**
 * Fetch current ticker data
 * @param symbol - Trading pair (e.g., 'BTC/USDT')
 */
export async function fetchTicker(symbol: string) {
    const client = getBinanceClient();
    try {
        return await client.fetchTicker(symbol);
    } catch (error) {
        console.error(`Error fetching ticker for ${symbol}:`, error);
        throw new Error(`Failed to fetch ticker for ${symbol}`);
    }
}

/**
 * Fetch funding rate for futures
 * @param symbol - Trading pair (e.g., 'BTC/USDT')
 */
export async function fetchFundingRate(symbol: string) {
    const client = getBinanceClient();
    try {
        const fundingRate = await client.fetchFundingRate(symbol);
        return {
            symbol: fundingRate.symbol,
            fundingRate: fundingRate.fundingRate || 0,
            fundingTimestamp: fundingRate.fundingTimestamp || Date.now(),
            nextFundingTime: fundingRate.fundingDatetime || Date.now(),
        };
    } catch (error) {
        console.error(`Error fetching funding rate for ${symbol}:`, error);
        throw new Error(`Failed to fetch funding rate for ${symbol}`);
    }
}

/**
 * Fetch top gainers (24h price change)
 */
export async function fetchTopGainers(limit: number = 10) {
    const client = getBinanceClient();
    try {
        const tickers = await client.fetchTickers();
        const tickersArray = Object.values(tickers)
            .filter(ticker => ticker.symbol?.includes('/USDT'))
            .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
            .slice(0, limit);

        return tickersArray.map((ticker, index) => ({
            symbol: ticker.symbol || '',
            priceChangePercent: ticker.percentage || 0,
            rank: index + 1,
        }));
    } catch (error) {
        console.error('Error fetching top gainers:', error);
        throw new Error('Failed to fetch top gainers');
    }
}

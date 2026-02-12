import ccxt from 'ccxt';

// Binance client singleton
let binanceInstance: ccxt.binance | null = null;

export function getBinanceClient(): ccxt.binance {
    if (!binanceInstance) {
        binanceInstance = new ccxt.binance({
            enableRateLimit: true,
            options: {
                defaultType: 'future', // Use futures market by default
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
) {
    const client = getBinanceClient();
    try {
        const ohlcv = await client.fetchOHLCV(symbol, timeframe, undefined, limit);
        return ohlcv.map(candle => ({
            timestamp: candle[0],
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
            volume: candle[5],
        }));
    } catch (error) {
        console.error(`Error fetching OHLCV for ${symbol}:`, error);
        throw error;
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
        throw error;
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
        throw error;
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
        throw error;
    }
}

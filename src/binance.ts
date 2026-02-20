/**
 * Binance Service — OHLCV, Funding Rate, Long/Short Ratio, Futures Pairs
 */
import ccxt from 'ccxt';
import type { CandleData } from './types';

const exchange = new ccxt.binance({ enableRateLimit: true, options: { defaultType: 'future' } });

/** Fetch OHLCV candles */
export async function fetchOHLCV(symbol: string, timeframe: string, limit = 100): Promise<CandleData[]> {
    const data = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    return data.map((c: any) => ({
        timestamp: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5],
    }));
}

/** Fetch funding rate */
export async function fetchFundingRate(symbol: string): Promise<number> {
    try {
        const fr = await exchange.fetchFundingRate(symbol);
        return fr.fundingRate || 0;
    } catch { return 0; }
}

/** Fetch Long/Short account ratio */
export async function fetchLSRatio(symbol: string): Promise<number> {
    try {
        const pair = symbol.replace('/', '');
        const res = await fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${pair}&period=1h&limit=1`);
        const data: any = await res.json();
        return data?.length > 0 ? parseFloat(data[0].longShortRatio) || 1 : 1;
    } catch { return 1; }
}

/** Get all active Binance Futures USDT perpetual pairs */
export async function getActivePairs(): Promise<string[]> {
    try {
        const res = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo');
        const data: any = await res.json();
        return data.symbols
            .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT' && s.contractType === 'PERPETUAL')
            .map((s: any) => `${s.baseAsset}/USDT`);
    } catch {
        console.error('Futures pairs alınamadı');
        return [];
    }
}

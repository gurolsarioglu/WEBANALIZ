import axios from 'axios';
import { fetchTicker } from './binance-client';

const COINGLASS_API_V2 = 'https://open-api.coinglass.com/public/v2';

interface CoinglassLiquidationLevel {
    price: number;
    volUsd: number;
    lev?: number;
}

/**
 * Fetch liquidation heatmap data from Coinglass
 * @param symbol - Coin symbol (e.g., 'BTC' or 'BTC/USDT')
 */
export async function fetchLiquidationData(symbol: string) {
    try {
        // Extract base currency (e.g., 'BTC' from 'BTC/USDT')
        const baseCurrency = symbol.includes('/') ? symbol.split('/')[0] : symbol;

        // Get current price from Binance
        const ticker = await fetchTicker(`${baseCurrency}/USDT`);
        const currentPrice = ticker.last || 0;

        // Fetch liquidation heatmap from Coinglass
        // Using the aggregate liqHeatmap endpoint
        const response = await axios.get(
            `${COINGLASS_API_V2}/aggregate/liqHeatmap`,
            {
                params: {
                    symbol: baseCurrency,
                    timeType: 1, // 1 for 12 hours
                },
                headers: {
                    'accept': 'application/json',
                },
                timeout: 10000,
            }
        );

        if (response.data && response.data.code === '0' && response.data.data) {
            const heatmapData = response.data.data;

            // Parse the liquidation levels
            const levels = parseCoinglassHeatmap(heatmapData, currentPrice);

            const now = Date.now();
            return {
                symbol: baseCurrency,
                currentPrice,
                liquidationLevels: levels,
                timestamp: now,
                lastUpdate: new Date(now).toLocaleString('tr-TR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                rawData: heatmapData,
            };
        } else {
            throw new Error('Invalid response from Coinglass API');
        }
    } catch (error: any) {
        console.error(`Error fetching liquidation data for ${symbol}:`, error.message);

        // Fallback to mock data
        return generateMockLiquidationData(symbol);
    }
}

/**
 * Parse Coinglass heatmap data to extract high-density liquidation levels
 * Yellow/high-density areas are represented by higher volUsd values
 */
function parseCoinglassHeatmap(heatmapData: any, currentPrice: number) {
    try {
        // Coinglass returns data in format: { price: number, volUsd: number }[]
        const levels: CoinglassLiquidationLevel[] = heatmapData.data || [];

        if (!Array.isArray(levels) || levels.length === 0) {
            throw new Error('No liquidation levels in response');
        }

        // Sort by volume (highest first) to find "yellow" zones
        const sortedByVolume = [...levels].sort((a, b) => (b.volUsd || 0) - (a.volUsd || 0));

        // Find highest volume levels above and below current price
        const levelsAbove = sortedByVolume.filter(l => l.price > currentPrice);
        const levelsBelow = sortedByVolume.filter(l => l.price < currentPrice);

        // Get the highest liquidation concentration zones
        const upsideLevel = levelsAbove[0] || sortedByVolume[0];
        const downsideLevel = levelsBelow[0] || sortedByVolume[1];

        // Calculate leverage based on price difference (approximate)
        const calculateLeverage = (targetPrice: number, current: number) => {
            const percentDiff = Math.abs((targetPrice - current) / current) * 100;
            // Leverage = 100 / % price move (approximate)
            return percentDiff > 0 ? Math.round(100 / percentDiff) : 1;
        };

        return {
            upside: {
                price: upsideLevel?.price || currentPrice * 1.05,
                level: upsideLevel?.volUsd || 0,
                leverage: upsideLevel?.lev || calculateLeverage(upsideLevel?.price || currentPrice * 1.05, currentPrice),
            },
            downside: {
                price: downsideLevel?.price || currentPrice * 0.95,
                level: downsideLevel?.volUsd || 0,
                leverage: downsideLevel?.lev || calculateLeverage(downsideLevel?.price || currentPrice * 0.95, currentPrice),
            },
        };
    } catch (error) {
        console.error('Error parsing Coinglass heatmap:', error);
        return {
            upside: {
                price: currentPrice * 1.05,
                level: 0,
                leverage: 20,
            },
            downside: {
                price: currentPrice * 0.95,
                level: 0,
                leverage: 20,
            },
        };
    }
}

/**
 * Generate mock liquidation data for development/testing
 */
function generateMockLiquidationData(symbol: string) {
    const currentPrice = Math.random() * 50000 + 20000; // Random price

    return {
        symbol,
        currentPrice,
        liquidationLevels: {
            upside: {
                price: currentPrice * 1.05, // 5% above
                level: Math.random() * 100000000 + 50000000,
            },
            downside: {
                price: currentPrice * 0.95, // 5% below
                level: Math.random() * 100000000 + 50000000,
            },
        },
    };
}

/**
 * Parse liquidation data to extract key levels
 */
export function parseLiquidationLevels(data: any) {
    return {
        upside: {
            price: data.liquidationLevels?.upside?.price || 0,
            level: data.liquidationLevels?.upside?.level || 0,
            leverage: data.liquidationLevels?.upside?.leverage,
        },
        downside: {
            price: data.liquidationLevels?.downside?.price || 0,
            level: data.liquidationLevels?.downside?.level || 0,
            leverage: data.liquidationLevels?.downside?.leverage,
        },
        currentPrice: data.currentPrice || 0,
        timestamp: data.timestamp,
        lastUpdate: data.lastUpdate,
    };
}

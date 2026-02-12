import { fetchOHLCV } from '@/shared/services/binance.service';
import { TrendAnalyzer } from '../models/TrendModel';
import { TIMEFRAMES } from '@/shared/config/constants';
import type { TrendAnalysisResult } from '@/shared/types';

/**
 * Trend Service
 * Handles trend analysis for multiple timeframes
 */
export class TrendService {
    /**
     * Analyze trend for a given symbol
     * @param symbol - Trading pair (e.g., 'BTC/USDT')
     * @returns Trend analysis result for weekly and daily timeframes
     */
    async analyzeTrend(symbol: string): Promise<TrendAnalysisResult | null> {
        try {
            // Fetch OHLCV data for both timeframes in parallel
            const [weeklyData, dailyData] = await Promise.all([
                fetchOHLCV(symbol, TIMEFRAMES.ONE_WEEK, 250).catch(() => []),
                fetchOHLCV(symbol, TIMEFRAMES.ONE_DAY, 250).catch(() => []),
            ]);

            // Check if we have any usable data
            if (!TrendAnalyzer.validateData(dailyData)) {
                console.warn(`Insufficient data for ${symbol} - coin may have low liquidity or be newly listed`);
                return null; // Return null instead of throwing error
            }

            // Analyze daily trend (always available)
            const dailyAnalyzer = new TrendAnalyzer(dailyData, '1D');
            const daily = dailyAnalyzer.analyze();

            // Try weekly analysis if data is available
            let weekly;
            if (TrendAnalyzer.validateData(weeklyData)) {
                const weeklyAnalyzer = new TrendAnalyzer(weeklyData, '1W');
                weekly = weeklyAnalyzer.analyze();
            } else {
                // Fallback: use daily data for both (low-liquidity coins)
                console.warn(`Weekly data unavailable for ${symbol}, using daily data as fallback`);
                weekly = daily; // Use same values as daily
            }

            return {
                weekly,
                daily,
            };
        } catch (error: any) {
            console.error(`Trend analysis error for ${symbol}:`, error);
            return null; // Return null on error instead of throwing
        }
    }
}

// Export singleton instance
export const trendService = new TrendService();

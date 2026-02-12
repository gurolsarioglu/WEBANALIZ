import { fetchOHLCV, fetchTicker } from '@/shared/services/binance.service';
import { TrendAnalyzer } from '@/modules/trend/models/TrendModel';
import { BTCCorrelationAnalyzer } from '../models/BTCCorrelationModel';
import { TIMEFRAMES, DEFAULT_SYMBOLS } from '@/shared/config/constants';
import type { BTCCorrelationResult } from '@/shared/types';

/**
 * BTC Correlation Service
 * Analyzes correlation between a coin and Bitcoin
 */
export class BTCCorrelationService {
    async analyzeCorrelation(symbol: string): Promise<BTCCorrelationResult> {
        try {
            // Fetch BTC data
            const [btcWeeklyData, btcDailyData, btcTicker] = await Promise.all([
                fetchOHLCV(DEFAULT_SYMBOLS.BTC, TIMEFRAMES.ONE_WEEK, 250),
                fetchOHLCV(DEFAULT_SYMBOLS.BTC, TIMEFRAMES.ONE_DAY, 250),
                fetchTicker(DEFAULT_SYMBOLS.BTC),
            ]);

            // Analyze BTC trends
            const btcWeeklyAnalyzer = new TrendAnalyzer(btcWeeklyData, '1W');
            const btcDailyAnalyzer = new TrendAnalyzer(btcDailyData, '1D');
            const btcWeeklyResult = btcWeeklyAnalyzer.analyze();
            const btcDailyResult = btcDailyAnalyzer.analyze();

            // If symbol is BTC, return early
            if (symbol === DEFAULT_SYMBOLS.BTC) {
                return {
                    btcPrice: btcTicker.last || 0,
                    btcTrend: {
                        weekly: btcWeeklyResult.trend,
                        daily: btcDailyResult.trend,
                    },
                    btcVolume: btcTicker.quoteVolume || 0,
                    correlation: 'ALIGNED',
                };
            }

            // Fetch target coin data
            const [coinWeeklyData, coinDailyData] = await Promise.all([
                fetchOHLCV(symbol, TIMEFRAMES.ONE_WEEK, 250),
                fetchOHLCV(symbol, TIMEFRAMES.ONE_DAY, 250),
            ]);

            // Analyze coin trends
            const coinWeeklyAnalyzer = new TrendAnalyzer(coinWeeklyData, '1W');
            const coinDailyAnalyzer = new TrendAnalyzer(coinDailyData, '1D');
            const coinWeeklyResult = coinWeeklyAnalyzer.analyze();
            const coinDailyResult = coinDailyAnalyzer.analyze();

            // Analyze correlation
            const correlationAnalyzer = new BTCCorrelationAnalyzer(
                btcWeeklyResult.trend,
                btcDailyResult.trend,
                coinWeeklyResult.trend,
                coinDailyResult.trend
            );

            return correlationAnalyzer.analyze(
                btcTicker.last || 0,
                btcTicker.quoteVolume || 0
            );
        } catch (error: any) {
            console.error(`BTC correlation error for ${symbol}:`, error);
            throw new Error(`Failed to analyze BTC correlation: ${error.message}`);
        }
    }
}

export const btcCorrelationService = new BTCCorrelationService();

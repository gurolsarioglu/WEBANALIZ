import { volumeService } from '@/modules/volume/services/VolumeService';
import { trendService } from '@/modules/trend/services/TrendService';
import { btcCorrelationService } from '@/modules/btc-correlation/services/BTCCorrelationService';
import { fundingRateService } from '@/modules/funding-rate/services/FundingRateService';
import { fetchOHLCV, fetchTicker } from '@/shared/services/binance.service';
import { SignalAggregator, type AggregatedData, type TradingSignal } from '../models/SignalAggregatorModel';

/**
 * Signal Aggregator Service
 * Orchestrates data collection from all modules
 */
export class SignalAggregatorService {
    /**
     * Analyze symbol and generate trading signal
     * @param symbol - Trading pair (e.g., 'BTC/USDT')
     * @param capital - Trading capital in USD (default: 1000)
     * @param riskPercent - Risk per trade (default: 2%)
     */
    async analyzeSignal(
        symbol: string,
        capital: number = 1000,
        riskPercent: number = 2
    ): Promise<TradingSignal | null> {
        try {
            // Fetch data from all modules in parallel
            const [volume, trend, btc, funding, ticker, candleData] = await Promise.all([
                volumeService.checkVolume(symbol).catch(() => null),
                trendService.analyzeTrend(symbol).catch(() => null),
                btcCorrelationService.analyzeCorrelation(symbol).catch(() => null),
                fundingRateService.getFundingRate(symbol).catch(() => null),
                fetchTicker(symbol).catch(() => null),
                fetchOHLCV(symbol, '1d', 100).catch(() => []),
            ]);

            // Validate we have minimum required data
            if (!ticker || !candleData || candleData.length < 50) {
                console.warn(`Insufficient data for signal generation: ${symbol}`);
                return null;
            }

            // Aggregate data
            const aggregatedData: AggregatedData = {
                volume,
                trend,
                btc,
                funding,
                currentPrice: ticker.last || 0,
                candleData,
            };

            // Create analyzer and generate signal
            const analyzer = new SignalAggregator(aggregatedData, capital, riskPercent);
            const signal = analyzer.analyze();

            return signal;
        } catch (error: any) {
            console.error(`Signal aggregation error for ${symbol}:`, error);
            return null;
        }
    }
}

// Export singleton instance
export const signalAggregatorService = new SignalAggregatorService();

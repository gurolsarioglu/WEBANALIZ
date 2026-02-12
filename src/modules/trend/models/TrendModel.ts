import type { TrendData } from '@/shared/types';
import { calculateSMA, calculateRSI, determineTrend, getTrendEmoji } from '@/shared/utils/indicators';
import { INDICATOR_PERIODS, TREND_CONFIG } from '@/shared/config/constants';
import type { CandleData } from '@/shared/types';

/**
 * Trend Analyzer Model
 * Business logic for trend analysis using MA and RSI
 */
export class TrendAnalyzer {
    private candleData: CandleData[];
    private timeframe: '1W' | '1D';

    constructor(candleData: CandleData[], timeframe: '1W' | '1D') {
        this.candleData = candleData;
        this.timeframe = timeframe;
    }

    /**
     * Analyze trend and return result
     */
    public analyze(): TrendData {
        // Calculate indicators
        const ma50Array = calculateSMA(this.candleData, INDICATOR_PERIODS.MA_SHORT);
        const ma200Array = calculateSMA(this.candleData, INDICATOR_PERIODS.MA_LONG);
        const rsiArray = calculateRSI(this.candleData, INDICATOR_PERIODS.RSI);

        // Get latest values
        const ma50 = ma50Array[ma50Array.length - 1];
        const ma200 = ma200Array[ma200Array.length - 1];
        const rsi = rsiArray[rsiArray.length - 1];

        // Determine trend
        const trend = determineTrend(ma50, ma200, rsi);
        const signal = getTrendEmoji(trend);

        return {
            timeframe: this.timeframe,
            ma50: ma50 || 0,
            ma200: ma200 || 0,
            rsi: rsi || 0,
            trend,
            signal,
        };
    }

    /**
     * Validate candle data
     */
    public static validateData(data: CandleData[]): boolean {
        return Array.isArray(data) &&
            data.length >= INDICATOR_PERIODS.MA_LONG &&
            data.every(candle =>
                candle.close > 0 &&
                !isNaN(candle.close)
            );
    }
}

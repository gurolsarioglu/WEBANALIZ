import type { BTCCorrelationResult } from '@/shared/types';
import { determineTrend } from '@/shared/utils/indicators';

/**
 * BTC Correlation Analyzer Model
 * Determines correlation between target coin and Bitcoin
 */
export class BTCCorrelationAnalyzer {
    private btcWeeklyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    private btcDailyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    private coinWeeklyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    private coinDailyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';

    constructor(
        btcWeeklyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
        btcDailyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
        coinWeeklyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
        coinDailyTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
    ) {
        this.btcWeeklyTrend = btcWeeklyTrend;
        this.btcDailyTrend = btcDailyTrend;
        this.coinWeeklyTrend = coinWeeklyTrend;
        this.coinDailyTrend = coinDailyTrend;
    }

    /**
     * Determine correlation status
     */
    public determineCorrelation(): 'ALIGNED' | 'DIVERGENT' {
        const weeklyAligned = this.btcWeeklyTrend === this.coinWeeklyTrend;
        const dailyAligned = this.btcDailyTrend === this.coinDailyTrend;

        return (weeklyAligned && dailyAligned) ? 'ALIGNED' : 'DIVERGENT';
    }

    /**
     * Generate warning message if applicable
     */
    public generateWarning(correlation: 'ALIGNED' | 'DIVERGENT'): string | undefined {
        if (correlation === 'DIVERGENT') {
            return '⚠️ Coin trendi Bitcoin ile uyumlu değil. Dikkatli olun!';
        }

        if (this.btcWeeklyTrend === 'BEARISH' || this.btcDailyTrend === 'BEARISH') {
            return '⚠️ Bitcoin düşüş trendinde. Genel piyasa riski var.';
        }

        return undefined;
    }

    /**
     * Build complete correlation result
     */
    public analyze(btcPrice: number, btcVolume: number): Omit<BTCCorrelationResult, 'btcVolume'> & { btcVolume: number } {
        const correlation = this.determineCorrelation();
        const warning = this.generateWarning(correlation);

        return {
            btcPrice,
            btcTrend: {
                weekly: this.btcWeeklyTrend,
                daily: this.btcDailyTrend,
            },
            btcVolume,
            correlation,
            warning,
        };
    }
}

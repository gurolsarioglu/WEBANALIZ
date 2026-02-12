import { signalAggregatorService } from '../services/SignalAggregatorService';
import type { TradingSignal } from '../models/SignalAggregatorModel';

/**
 * Signal Aggregator Controller
 * Handles API requests for trading signals
 */
export class SignalAggregatorController {
    /**
     * Handle signal aggregation request
     * @param symbol - Trading pair symbol
     * @param capital - Optional trading capital
     * @param riskPercent - Optional risk percentage
     */
    async handleSignalRequest(
        symbol: string,
        capital?: number,
        riskPercent?: number
    ): Promise<{
        success: boolean;
        data?: TradingSignal | null;
        error?: string;
    }> {
        try {
            if (!symbol || typeof symbol !== 'string') {
                return {
                    success: false,
                    error: 'Symbol parameter is required',
                };
            }

            const signal = await signalAggregatorService.analyzeSignal(
                symbol,
                capital,
                riskPercent
            );

            if (!signal) {
                return {
                    success: true,
                    data: null, // Insufficient data, but not an error
                };
            }

            return {
                success: true,
                data: signal,
            };
        } catch (error: any) {
            console.error('Signal controller error:', error);
            return {
                success: false,
                error: error.message || 'Failed to generate trading signal',
            };
        }
    }
}

// Export singleton instance
export const signalAggregatorController = new SignalAggregatorController();

import { trendService } from '../services/TrendService';
import type { TrendAnalysisResult } from '@/shared/types';

/**
 * Trend Controller
 * Handles trend analysis requests
 */
export class TrendController {
    /**
     * Handle trend analysis request
     * @param symbol - Trading pair symbol
     * @returns Trend analysis result or error
     */
    async handleTrendAnalysis(symbol: string): Promise<{
        success: boolean;
        data?: TrendAnalysisResult | null;
        error?: string;
    }> {
        try {
            if (!symbol || typeof symbol !== 'string') {
                return {
                    success: false,
                    error: 'Symbol parameter is required',
                };
            }

            const result = await trendService.analyzeTrend(symbol);

            if (!result) {
                return {
                    success: true,
                    data: null, // Explicitly return null for insufficient data
                };
            }

            return {
                success: true,
                data: result,
            };
        } catch (error: any) {
            console.error('Trend controller error:', error);
            return {
                success: false,
                error: error.message || 'Failed to analyze trend',
            };
        }
    }
}

// Export singleton instance
export const trendController = new TrendController();

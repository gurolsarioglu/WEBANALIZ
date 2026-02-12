import { btcCorrelationService } from '../services/BTCCorrelationService';
import type { BTCCorrelationResult } from '@/shared/types';

export class BTCCorrelationController {
    async handleAnalysis(symbol: string): Promise<{
        success: boolean;
        data?: BTCCorrelationResult;
        error?: string;
    }> {
        try {
            if (!symbol) {
                return { success: false, error: 'Symbol required' };
            }
            const result = await btcCorrelationService.analyzeCorrelation(symbol);
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

export const btcCorrelationController = new BTCCorrelationController();

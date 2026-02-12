import { fundingRateService } from '../services/FundingRateService';
import type { FundingRateResult } from '@/shared/types';

export class FundingRateController {
    async handleRequest(symbol: string): Promise<{
        success: boolean;
        data?: FundingRateResult;
        error?: string;
    }> {
        try {
            if (!symbol) return { success: false, error: 'Symbol required' };
            const result = await fundingRateService.getFundingRate(symbol);
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

export const fundingRateController = new FundingRateController();

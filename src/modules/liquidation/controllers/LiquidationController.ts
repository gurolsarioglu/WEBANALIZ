import { liquidationService } from '../services/LiquidationService';
import type { LiquidationResult } from '@/shared/types';

export class LiquidationController {
    async handleRequest(symbol: string): Promise<{
        success: boolean;
        data?: LiquidationResult;
        error?: string;
    }> {
        try {
            if (!symbol) return { success: false, error: 'Symbol required' };
            const result = await liquidationService.getLiquidation(symbol);
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

export const liquidationController = new LiquidationController();

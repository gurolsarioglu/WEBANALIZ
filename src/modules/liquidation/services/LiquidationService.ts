import { fetchLiquidationData } from '@/shared/services/coinglass.service';
import { LiquidationAnalyzer } from '../models/LiquidationModel';
import type { LiquidationResult } from '@/shared/types';

export class LiquidationService {
    async getLiquidation(symbol: string): Promise<LiquidationResult> {
        try {
            const rawData = await fetchLiquidationData(symbol);
            const analyzer = new LiquidationAnalyzer(rawData);
            return analyzer.parseLevels();
        } catch (error: any) {
            console.error(`Liquidation error for ${symbol}:`, error);
            throw new Error(`Failed to get liquidation data: ${error.message}`);
        }
    }
}

export const liquidationService = new LiquidationService();

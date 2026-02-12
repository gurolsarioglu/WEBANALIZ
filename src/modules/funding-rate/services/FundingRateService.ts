import { fetchFundingRate, fetchTopGainers } from '@/shared/services/binance.service';
import { FundingRateAnalyzer } from '../models/FundingRateModel';
import type { FundingRateResult } from '@/shared/types';

export class FundingRateService {
    async getFundingRate(symbol: string): Promise<FundingRateResult> {
        try {
            const [fundingData, topGainers] = await Promise.all([
                fetchFundingRate(symbol),
                fetchTopGainers(10),
            ]);

            // Build history with current rate (simplified - in production, fetch real history)
            const history = [{
                timestamp: fundingData.fundingTimestamp,
                rate: fundingData.fundingRate,
            }];

            const analyzer = new FundingRateAnalyzer(
                fundingData.fundingRate,
                history,
                topGainers,
                symbol
            );

            return analyzer.analyze();
        } catch (error: any) {
            console.error(`Funding rate error for ${symbol}:`, error);
            throw new Error(`Failed to get funding rate: ${error.message}`);
        }
    }
}

export const fundingRateService = new FundingRateService();

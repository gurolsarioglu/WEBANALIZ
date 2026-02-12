import type { LiquidationResult } from '@/shared/types';

export class LiquidationAnalyzer {
    private rawData: any;

    constructor(rawData: any) {
        this.rawData = rawData;
    }

    public parseLevels(): LiquidationResult {
        return {
            upside: {
                price: this.rawData.liquidationLevels?.upside?.price || 0,
                level: this.rawData.liquidationLevels?.upside?.level || 0,
                leverage: this.rawData.liquidationLevels?.upside?.leverage,
            },
            downside: {
                price: this.rawData.liquidationLevels?.downside?.price || 0,
                level: this.rawData.liquidationLevels?.downside?.level || 0,
                leverage: this.rawData.liquidationLevels?.downside?.leverage,
            },
            currentPrice: this.rawData.currentPrice || 0,
            timestamp: this.rawData.timestamp,
            lastUpdate: this.rawData.lastUpdate,
        };
    }
}

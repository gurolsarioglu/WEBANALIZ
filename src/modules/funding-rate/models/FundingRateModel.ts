import type { FundingRateResult, TopGainer, FundingRateHistory } from '@/shared/types';

export class FundingRateAnalyzer {
    private currentRate: number;
    private history: FundingRateHistory[];
    private topGainers: TopGainer[];
    private symbol: string;

    constructor(
        currentRate: number,
        history: FundingRateHistory[],
        topGainers: TopGainer[],
        symbol: string
    ) {
        this.currentRate = currentRate;
        this.history = history;
        this.topGainers = topGainers;
        this.symbol = symbol;
    }

    public analyze(): FundingRateResult {
        const coinRank = this.findCoinRank();

        return {
            currentRate: this.currentRate,
            timestamp: Date.now(),
            history: this.history,
            topGainers: this.topGainers,
            coinRank,
        };
    }

    private findCoinRank(): number | undefined {
        const index = this.topGainers.findIndex(g => g.symbol === this.symbol);
        return index >= 0 ? index + 1 : undefined;
    }
}

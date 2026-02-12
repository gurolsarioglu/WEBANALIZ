/**
 * Risk Calculator for Position Sizing and Stop Loss
 */

/**
 * Position Size Calculation
 * @param capital - Total trading capital (USD)
 * @param riskPercent - Risk percentage per trade (e.g., 2 for 2%)
 * @param entryPrice - Entry price
 * @param stopLoss - Stop loss price
 * @returns Position size in USD
 */
export function calculatePositionSize(
    capital: number,
    riskPercent: number,
    entryPrice: number,
    stopLoss: number
): number {
    if (capital <= 0 || riskPercent <= 0 || entryPrice <= 0 || stopLoss <= 0) {
        throw new Error('Invalid input parameters for position size calculation');
    }

    if (entryPrice <= stopLoss) {
        throw new Error('Entry price must be greater than stop loss for long positions');
    }

    // Calculate risk amount in USD
    const riskAmount = capital * (riskPercent / 100);

    // Calculate loss per unit
    const lossPerUnit = entryPrice - stopLoss;

    // Calculate position size
    const positionSize = riskAmount / lossPerUnit;

    return Math.floor(positionSize * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate Risk/Reward Ratio
 * @param entryPrice - Entry price
 * @param stopLoss - Stop loss price
 * @param takeProfit - Take profit price
 * @returns R/R ratio (e.g., 2.5 for 1:2.5)
 */
export function calculateRiskReward(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
): number {
    const risk = entryPrice - stopLoss;
    const reward = takeProfit - entryPrice;

    if (risk <= 0) {
        return 0;
    }

    return Math.round((reward / risk) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate multiple take profit levels based on R/R ratios
 * @param entryPrice - Entry price
 * @param stopLoss - Stop loss price
 * @param ratios - Target R/R ratios (e.g., [2, 3, 4])
 * @returns Array of take profit prices
 */
export function calculateTakeProfits(
    entryPrice: number,
    stopLoss: number,
    ratios: number[] = [2, 3, 4]
): number[] {
    const risk = entryPrice - stopLoss;

    return ratios.map(ratio => {
        const reward = risk * ratio;
        return Math.round((entryPrice + reward) * 100) / 100;
    });
}

/**
 * Calculate stop loss based on percentage
 * @param entryPrice - Entry price
 * @param percent - Stop loss percentage (e.g., 2 for 2%)
 * @returns Stop loss price
 */
export function calculateStopLossPercent(
    entryPrice: number,
    percent: number
): number {
    return Math.round(entryPrice * (1 - percent / 100) * 100) / 100;
}

/**
 * Calculate potential profit and loss
 * @param positionSize - Position size in USD
 * @param entryPrice - Entry price
 * @param exitPrice - Exit price (stop loss or take profit)
 * @returns Profit/loss in USD
 */
export function calculatePnL(
    positionSize: number,
    entryPrice: number,
    exitPrice: number
): number {
    const quantity = positionSize / entryPrice;
    const pnl = quantity * (exitPrice - entryPrice);
    return Math.round(pnl * 100) / 100;
}

/**
 * Calculate expected value of a trade
 * @param winRate - Probability of winning (0-1, e.g., 0.65 for 65%)
 * @param avgWin - Average win amount
 * @param avgLoss - Average loss amount
 * @returns Expected value per trade
 */
export function calculateExpectedValue(
    winRate: number,
    avgWin: number,
    avgLoss: number
): number {
    const lossRate = 1 - winRate;
    const ev = (winRate * avgWin) - (lossRate * avgLoss);
    return Math.round(ev * 100) / 100;
}

/**
 * Risk metrics summary
 */
export interface RiskMetrics {
    positionSize: number;
    maxLoss: number;
    potentialProfits: number[];
    riskRewardRatios: number[];
    expectedValue: number;
}

/**
 * Calculate comprehensive risk metrics
 */
export function calculateRiskMetrics(
    capital: number,
    riskPercent: number,
    entryPrice: number,
    stopLoss: number,
    takeProfits: number[],
    winRate: number = 0.6
): RiskMetrics {
    const positionSize = calculatePositionSize(capital, riskPercent, entryPrice, stopLoss);
    const maxLoss = calculatePnL(positionSize, entryPrice, stopLoss);
    const potentialProfits = takeProfits.map(tp => calculatePnL(positionSize, entryPrice, tp));
    const riskRewardRatios = takeProfits.map(tp => calculateRiskReward(entryPrice, stopLoss, tp));

    // Calculate EV based on first take profit target
    const avgWin = potentialProfits[0] || 0;
    const avgLoss = Math.abs(maxLoss);
    const expectedValue = calculateExpectedValue(winRate, avgWin, avgLoss);

    return {
        positionSize,
        maxLoss,
        potentialProfits,
        riskRewardRatios,
        expectedValue,
    };
}

import type {
    VolumeCheckResult,
    TrendAnalysisResult,
    BTCCorrelationResult,
    FundingRateResult,
    CandleData,
} from '@/shared/types';
import { calculateATR, getLatestValue } from '@/shared/utils/indicators';
import {
    calculateFibonacci,
    findNearestFibLevel,
    isInValueZone,
    type FibonacciLevels,
} from '../utils/FibonacciCalculator';
import {
    calculateStopLossPercent,
    calculateTakeProfits,
    calculateRiskMetrics,
    type RiskMetrics,
} from '../utils/RiskCalculator';

/**
 * Signal Types
 */
export type SignalType = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

/**
 * Aggregated Module Data
 */
export interface AggregatedData {
    volume: VolumeCheckResult | null;
    trend: TrendAnalysisResult | null;
    btc: BTCCorrelationResult | null;
    funding: FundingRateResult | null;
    currentPrice: number;
    candleData: CandleData[];
}

/**
 * Trading Signal Result
 */
export interface TradingSignal {
    signal: SignalType;
    confidence: number; // 0-100
    entry: number;
    stopLoss: number;
    takeProfits: number[];
    riskRewardRatios: number[];
    positionSize: number;
    reasons: string[];
    warnings: string[];
    fibonacci: FibonacciLevels;
    riskMetrics: RiskMetrics;
    metadata: {
        rsi: number;
        ma50: number;
        ma200: number;
        volumeChange: number;
        fundingRate: number;
        atr: number;
    };
}

/**
 * Signal Aggregator Analyzer
 * Combines all module signals into actionable trading decision
 */
export class SignalAggregator {
    constructor(
        private data: AggregatedData,
        private capital: number = 1000,
        private riskPercent: number = 2
    ) { }

    /**
     * Main analysis method
     */
    public analyze(): TradingSignal {
        const score = this.calculateScore();
        const signal = this.determineSignal(score);
        const reasons = this.generateReasons();
        const warnings = this.generateWarnings();

        // Calculate Fibonacci levels
        const fibonacci = calculateFibonacci(this.data.candleData, 50);

        // Calculate ATR for stop-loss
        const atrArray = calculateATR(this.data.candleData, 14);
        const atr = getLatestValue(atrArray);

        // Determine entry, stop-loss, and take-profits
        const entry = this.data.currentPrice;
        const stopLoss = this.calculateStopLoss(entry, atr, fibonacci);
        const takeProfits = calculateTakeProfits(entry, stopLoss, [2, 3, 4]);

        // Calculate risk metrics
        const riskMetrics = calculateRiskMetrics(
            this.capital,
            this.riskPercent,
            entry,
            stopLoss,
            takeProfits,
            this.estimateWinRate(score)
        );

        return {
            signal,
            confidence: score,
            entry,
            stopLoss,
            takeProfits,
            riskRewardRatios: riskMetrics.riskRewardRatios,
            positionSize: riskMetrics.positionSize,
            reasons,
            warnings,
            fibonacci,
            riskMetrics,
            metadata: {
                rsi: this.data.trend?.daily?.rsi || 50,
                ma50: this.data.trend?.daily?.ma50 || 0,
                ma200: this.data.trend?.daily?.ma200 || 0,
                volumeChange: this.data.volume?.volumeChangePercent || 0,
                fundingRate: this.data.funding?.currentRate || 0,
                atr,
            },
        };
    }

    /**
     * Calculate confidence score (0-100)
     */
    private calculateScore(): number {
        let score = 50; // Start neutral

        const trend = this.data.trend;
        const volume = this.data.volume;
        const btc = this.data.btc;
        const funding = this.data.funding;

        if (!trend || !trend.daily) return 50; // Not enough data

        const rsi = trend.daily.rsi;
        const ma50 = trend.daily.ma50;
        const ma200 = trend.daily.ma200;

        // RSI Signals (max ±20 points)
        if (rsi < 30) {
            score += 20; // Oversold - Strong Buy
        } else if (rsi < 40) {
            score += 10; // Approaching oversold
        } else if (rsi > 70) {
            score -= 20; // Overbought - Strong Sell
        } else if (rsi > 60) {
            score -= 10; // Approaching overbought
        }

        // Trend Alignment (max ±15 points)
        if (ma50 > ma200) {
            score += 15; // Golden Cross - Bullish
        } else if (ma50 < ma200) {
            score -= 15; // Death Cross - Bearish
        }

        // Volume Spike (max ±15 points)
        if (volume) {
            if (volume.volumeChangePercent > 50) {
                score += 15; // Strong volume
            } else if (volume.volumeChangePercent > 30) {
                score += 10;
            } else if (volume.volumeChangePercent < -20) {
                score -= 10; // Declining volume
            }
        }

        // BTC Correlation (max ±10 points)
        if (btc) {
            if (btc.correlation === 'ALIGNED') {
                score += 10; // Market alignment
            } else if (btc.correlation === 'DIVERGENT') {
                score -= 10; // Against market
            }
        }

        // Funding Rate (max ±10 points)
        if (funding) {
            if (funding.currentRate < 0) {
                score += 10; // Negative funding = shorts paying longs
            } else if (funding.currentRate > 0.05) {
                score -= 10; // High funding = risky longs
            }
        }

        // Multi-timeframe confirmation (max ±15 points)
        if (trend.weekly && trend.daily) {
            if (trend.weekly.trend === trend.daily.trend) {
                score += 15; // Both timeframes agree
            }
        }

        // Fibonacci levels (max ±15 points)
        const fib = calculateFibonacci(this.data.candleData, 50);
        if (isInValueZone(this.data.currentPrice, fib)) {
            score += 15; // In discount zone - good to buy
        }

        // Clamp score between 0 and 100
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Determine signal type based on score
     */
    private determineSignal(score: number): SignalType {
        if (score >= 75) return 'STRONG_BUY';
        if (score >= 60) return 'BUY';
        if (score <= 25) return 'STRONG_SELL';
        if (score <= 40) return 'SELL';
        return 'HOLD';
    }

    /**
     * Generate human-readable reasons
     */
    private generateReasons(): string[] {
        const reasons: string[] = [];
        const trend = this.data.trend;
        const volume = this.data.volume;
        const btc = this.data.btc;
        const funding = this.data.funding;

        if (!trend || !trend.daily) {
            reasons.push('Yetersiz veri');
            return reasons;
        }

        const rsi = trend.daily.rsi;

        // RSI reasons
        if (rsi < 30) reasons.push(`RSI(${rsi.toFixed(0)}) Aşırı Satım`);
        else if (rsi > 70) reasons.push(`RSI(${rsi.toFixed(0)}) Aşırı Alım`);

        // MA reasons
        if (trend.daily.ma50 > trend.daily.ma200) {
            reasons.push('Altın Çapraz (Golden Cross)');
        } else if (trend.daily.ma50 < trend.daily.ma200) {
            reasons.push('Ölüm Çapraz (Death Cross)');
        }

        // Volume
        if (volume && volume.volumeChangePercent > 50) {
            reasons.push(`Hacim Artışı +${volume.volumeChangePercent.toFixed(0)}%`);
        }

        // Fibonacci
        const fib = calculateFibonacci(this.data.candleData, 50);
        const nearLevel = findNearestFibLevel(this.data.currentPrice, fib);
        if (nearLevel) {
            reasons.push(`Fibonacci ${nearLevel.level} seviyesine yakın`);
        }

        // BTC correlation
        if (btc && btc.correlation === 'ALIGNED') {
            reasons.push('BTC ile uyumlu hareket');
        }

        // Funding rate
        if (funding && funding.currentRate < 0) {
            reasons.push('Negatif fonlama oranı (Short squeeze potansiyeli)');
        }

        return reasons;
    }

    /**
     * Generate warnings
     */
    private generateWarnings(): string[] {
        const warnings: string[] = [];
        const trend = this.data.trend;
        const btc = this.data.btc;
        const funding = this.data.funding;

        // Divergence warning
        if (btc && btc.correlation === 'DIVERGENT') {
            warnings.push('⚠️ BTC ile ters yönlü hareket - dikkatli olun');
        }

        // High funding warning
        if (funding && funding.currentRate > 0.05) {
            warnings.push('⚠️ Yüksek fonlama oranı - long pozisyon riskli');
        }

        // Low volume warning
        if (this.data.volume && this.data.volume.volumeChangePercent < -20) {
            warnings.push('⚠️ Düşük hacim - likidite riski');
        }

        // Overbought/Oversold extreme
        if (trend && trend.daily && trend.daily.rsi > 80) {
            warnings.push('⚠️ Aşırı alım bölgesi - düzeltme olabilir');
        }

        return warnings;
    }

    /**
     * Calculate stop-loss based on ATR or Fibonacci
     */
    private calculateStopLoss(entry: number, atr: number, fib: FibonacciLevels): number {
        // Method 1: ATR-based stop loss (2x ATR)
        const atrStopLoss = entry - (atr * 2);

        // Method 2: Below nearest Fibonacci support
        let fibStopLoss = calculateStopLossPercent(entry, 2); // Default 2%

        // Find nearest Fibonacci support below price
        const levels = [fib.level_236, fib.level_382, fib.level_500, fib.level_618, fib.level_786];
        for (const level of levels) {
            if (level < entry) {
                fibStopLoss = level * 0.995; // Slightly below Fib level
                break;
            }
        }

        // Use the tighter stop-loss (more conservative)
        const stopLoss = Math.max(atrStopLoss, fibStopLoss);
        return Math.round(stopLoss * 100) / 100;
    }

    /**
     * Estimate win rate based on confidence score
     */
    private estimateWinRate(score: number): number {
        // Simple linear mapping: score 50-100 → winrate 40%-70%
        const minWinRate = 0.4;
        const maxWinRate = 0.7;
        const normalized = (score - 50) / 50; // -1 to 1
        const winRate = minWinRate + (normalized * (maxWinRate - minWinRate));
        return Math.max(minWinRate, Math.min(maxWinRate, winRate));
    }
}

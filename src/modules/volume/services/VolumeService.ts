import { fetchTicker } from '@/shared/services/binance.service';
import { VolumeAnalyzer, validateVolumeData } from '../models/VolumeModel';
import type { VolumeCheckResult } from '@/shared/types';

/**
 * Volume Service
 * Handles data fetching and volume analysis
 */
export class VolumeService {
    /**
     * Check volume for a given symbol
     * @param symbol - Trading pair (e.g., 'BTC/USDT')
     * @returns Volume check result
     */
    async checkVolume(symbol: string): Promise<VolumeCheckResult> {
        try {
            // Fetch current ticker data
            const ticker = await fetchTicker(symbol);

            // Get 24h volume in USDT
            const current24hVolume = ticker.quoteVolume || 0;

            // For previous 24h volume, we use a simplified approach
            // In production, you would fetch historical ticker data
            // This simulates previous day volume with slight variation
            const previous24hVolume = current24hVolume * (1 + (Math.random() - 0.5) * 0.3);

            // Validate data
            if (!validateVolumeData(current24hVolume, previous24hVolume)) {
                throw new Error('Invalid volume data received');
            }

            // Use model for analysis
            const analyzer = new VolumeAnalyzer(current24hVolume, previous24hVolume);
            return analyzer.analyze();
        } catch (error: any) {
            console.error(`Volume check error for ${symbol}:`, error);
            throw new Error(`Failed to check volume: ${error.message}`);
        }
    }
}

// Export singleton instance
export const volumeService = new VolumeService();

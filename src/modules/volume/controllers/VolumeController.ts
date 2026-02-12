import { volumeService } from '../services/VolumeService';
import type { VolumeCheckResult } from '@/shared/types';

/**
 * Volume Controller
 * Handles volume check requests and responses
 */
export class VolumeController {
    /**
     * Handle volume check request
     * @param symbol - Trading pair symbol
     * @returns Volume check result or error
     */
    async handleVolumeCheck(symbol: string): Promise<{
        success: boolean;
        data?: VolumeCheckResult;
        error?: string;
    }> {
        try {
            // Validate symbol parameter
            if (!symbol || typeof symbol !== 'string') {
                return {
                    success: false,
                    error: 'Symbol parameter is required and must be a string',
                };
            }

            // Call service to check volume
            const result = await volumeService.checkVolume(symbol);

            return {
                success: true,
                data: result,
            };
        } catch (error: any) {
            console.error('Volume controller error:', error);
            return {
                success: false,
                error: error.message || 'Failed to check volume',
            };
        }
    }
}

// Export singleton instance
export const volumeController = new VolumeController();

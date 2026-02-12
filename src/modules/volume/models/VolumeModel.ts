import type { VolumeCheckResult } from '@/shared/types';
import { VOLUME_THRESHOLDS } from '@/shared/config/constants';

/**
 * Volume Analyzer Model
 * Business logic for volume analysis and signal determination
 */
export class VolumeAnalyzer {
    private current24hVolume: number;
    private previous24hVolume: number;

    constructor(current24hVolume: number, previous24hVolume: number) {
        this.current24hVolume = current24hVolume;
        this.previous24hVolume = previous24hVolume;
    }

    /**
     * Calculate volume change percentage
     */
    public calculateVolumeChange(): number {
        if (this.previous24hVolume === 0) {
            return 0;
        }
        return ((this.current24hVolume - this.previous24hVolume) / this.previous24hVolume) * 100;
    }

    /**
     * Determine signal based on volume change
     */
    public determineSignal(volumeChangePercent: number): VolumeCheckResult['signal'] {
        if (volumeChangePercent >= VOLUME_THRESHOLDS.MIN_CHANGE &&
            volumeChangePercent <= VOLUME_THRESHOLDS.MAX_CHANGE) {
            return 'SCALP_READY';
        } else if (volumeChangePercent < VOLUME_THRESHOLDS.LOW_THRESHOLD) {
            return 'VOLUME_LOW';
        } else {
            return 'VOLUME_HIGH';
        }
    }

    /**
     * Determine status based on signal
     */
    public determineStatus(signal: VolumeCheckResult['signal']): VolumeCheckResult['status'] {
        return signal === 'SCALP_READY' ? 'success' : 'warning';
    }

    /**
     * Analyze volume and return complete result
     */
    public analyze(): VolumeCheckResult {
        const volumeChangePercent = this.calculateVolumeChange();
        const signal = this.determineSignal(volumeChangePercent);
        const status = this.determineStatus(signal);

        return {
            current24hVolume: this.current24hVolume,
            previous24hVolume: this.previous24hVolume,
            volumeChangePercent,
            signal,
            status,
        };
    }
}

/**
 * Validate volume data
 */
export function validateVolumeData(current: number, previous: number): boolean {
    return current >= 0 && previous >= 0 && !isNaN(current) && !isNaN(previous);
}

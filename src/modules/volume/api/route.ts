import { NextRequest, NextResponse } from 'next/server';
import { volumeController } from '@/modules/volume/controllers/VolumeController';

/**
 * GET /api/analysis/volume-check
 * Check volume for a given symbol
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json(
            { error: 'Symbol parameter is required' },
            { status: 400 }
        );
    }

    const result = await volumeController.handleVolumeCheck(symbol);

    if (!result.success) {
        return NextResponse.json(
            { error: result.error },
            { status: 500 }
        );
    }

    return NextResponse.json(result.data);
}

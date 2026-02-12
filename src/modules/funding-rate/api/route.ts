import { NextRequest, NextResponse } from 'next/server';
import { fundingRateController } from '@/modules/funding-rate/controllers/FundingRateController';

export async function GET(request: NextRequest) {
    const symbol = request.nextUrl.searchParams.get('symbol');
    if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    const result = await fundingRateController.handleRequest(symbol);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json(result.data);
}

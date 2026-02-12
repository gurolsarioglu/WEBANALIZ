import { NextRequest, NextResponse } from 'next/server';
import { liquidationController } from '@/modules/liquidation/controllers/LiquidationController';

export async function GET(request: NextRequest) {
    const symbol = request.nextUrl.searchParams.get('symbol');
    if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    const result = await liquidationController.handleRequest(symbol);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json(result.data);
}

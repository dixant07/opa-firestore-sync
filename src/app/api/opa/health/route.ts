import { NextResponse } from 'next/server';
import { getHealth, getMetrics } from '@/lib/opa-server';

// GET /api/opa/health - Get OPA server health status
export async function GET() {
    try {
        const health = await getHealth();
        return NextResponse.json({ status: 'ok', ...health });
    } catch (error) {
        console.error('Error checking health:', error);
        return NextResponse.json(
            { status: 'error', error: error instanceof Error ? error.message : 'Health check failed' },
            { status: 503 }
        );
    }
}

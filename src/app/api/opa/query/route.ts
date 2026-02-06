import { NextRequest, NextResponse } from 'next/server';
import { queryData } from '@/lib/opa-server';

// POST /api/opa/query - Query OPA with input
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { path, input } = body;

        if (!path) {
            return NextResponse.json(
                { error: 'Query path is required' },
                { status: 400 }
            );
        }

        const result = await queryData(path, input || {});
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error querying data:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to query data' },
            { status: 500 }
        );
    }
}

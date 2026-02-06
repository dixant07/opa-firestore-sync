import { NextRequest, NextResponse } from 'next/server';
import { getAllData, putData } from '@/lib/opa-server';

// GET /api/opa/data - Get all data
export async function GET() {
    try {
        const data = await getAllData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error getting all data:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get data' },
            { status: 500 }
        );
    }
}

// PUT /api/opa/data - Put data at root
export async function PUT(request: NextRequest) {
    try {
        const data = await request.json();
        await putData('', data);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error putting data:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to put data' },
            { status: 500 }
        );
    }
}

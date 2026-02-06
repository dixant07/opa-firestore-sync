import { NextRequest, NextResponse } from 'next/server';
import { getData, putData, deleteData, patchData } from '@/lib/opa-server';

interface RouteParams {
    params: Promise<{ path: string[] }>;
}

// GET /api/opa/data/[...path] - Get data at path
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { path } = await params;
        const dataPath = path.join('/');
        const data = await getData(dataPath);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error getting data:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get data' },
            { status: 500 }
        );
    }
}

// PUT /api/opa/data/[...path] - Put data at path
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { path } = await params;
        const dataPath = path.join('/');
        const data = await request.json();
        await putData(dataPath, data);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error putting data:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to put data' },
            { status: 500 }
        );
    }
}

// DELETE /api/opa/data/[...path] - Delete data at path
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { path } = await params;
        const dataPath = path.join('/');
        await deleteData(dataPath);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting data:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete data' },
            { status: 500 }
        );
    }
}

// PATCH /api/opa/data/[...path] - Patch data at path
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { path } = await params;
        const dataPath = path.join('/');
        const data = await request.json();
        await patchData(dataPath, data);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error patching data:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to patch data' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPolicy, createPolicy, deletePolicy } from '@/lib/opa-server';

interface RouteParams {
    params: Promise<{ policyId: string }>;
}

// GET /api/opa/policies/[policyId] - Get a specific policy
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { policyId } = await params;
        const policy = await getPolicy(policyId);
        return NextResponse.json({ result: policy });
    } catch (error) {
        console.error('Error getting policy:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get policy' },
            { status: 500 }
        );
    }
}

// PUT /api/opa/policies/[policyId] - Update a policy
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { policyId } = await params;
        const contentType = request.headers.get('content-type') || '';

        let content: string;
        if (contentType.includes('application/json')) {
            const body = await request.json();
            content = body.content;
        } else {
            content = await request.text();
        }

        if (!content) {
            return NextResponse.json(
                { error: 'Policy content is required' },
                { status: 400 }
            );
        }

        await createPolicy(policyId, content);
        return NextResponse.json({ success: true, id: policyId });
    } catch (error) {
        console.error('Error updating policy:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to update policy' },
            { status: 500 }
        );
    }
}

// DELETE /api/opa/policies/[policyId] - Delete a policy
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { policyId } = await params;
        await deletePolicy(policyId);
        return NextResponse.json({ success: true, id: policyId });
    } catch (error) {
        console.error('Error deleting policy:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete policy' },
            { status: 500 }
        );
    }
}

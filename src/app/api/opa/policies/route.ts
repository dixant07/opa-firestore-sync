import { NextRequest, NextResponse } from 'next/server';
import { listPolicies, createPolicy } from '@/lib/opa-server';

// GET /api/opa/policies - List all policies
export async function GET() {
    try {
        const policies = await listPolicies();
        return NextResponse.json({ result: policies });
    } catch (error) {
        console.error('Error listing policies:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to list policies' },
            { status: 500 }
        );
    }
}

// POST /api/opa/policies - Create a new policy
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, content } = body;

        if (!id || !content) {
            return NextResponse.json(
                { error: 'Policy ID and content are required' },
                { status: 400 }
            );
        }

        await createPolicy(id, content);
        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Error creating policy:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create policy' },
            { status: 500 }
        );
    }
}

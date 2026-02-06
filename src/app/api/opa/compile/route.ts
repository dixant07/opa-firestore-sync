import { NextRequest, NextResponse } from 'next/server';
import { compilePolicy } from '@/lib/opa-server';

// POST /api/opa/compile - Validate/compile a Rego policy
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content } = body;

        if (!content) {
            return NextResponse.json(
                { error: 'Policy content is required' },
                { status: 400 }
            );
        }

        const result = await compilePolicy(content);
        return NextResponse.json({ valid: true, result });
    } catch (error) {
        console.error('Error compiling policy:', error);
        return NextResponse.json(
            { valid: false, error: error instanceof Error ? error.message : 'Compilation failed' },
            { status: 400 }
        );
    }
}

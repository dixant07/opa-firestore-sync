/* eslint-disable @typescript-eslint/no-explicit-any */
// Server-side OPA client for API routes
// This file contains the core logic for communicating with the OPA server
// Note: OPA server returns dynamic JSON structures, so 'any' types are necessary

const getOpaServerUrl = (): string => {
    const url = process.env.OPA_SERVER_URL;
    if (!url) {
        throw new Error('OPA_SERVER_URL environment variable is not set');
    }
    return url;
};

export interface OpaPolicy {
    id: string;
    raw?: string;
}

export interface OpaPolicyListResponse {
    result: OpaPolicy[] | Record<string, any>;
}

// Helper to handle OPA API responses
async function handleOpaResponse(response: Response): Promise<any> {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OPA API Error (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
}

// ============ Policy Operations ============

export async function listPolicies(): Promise<{ id: string; path: string; size: number }[]> {
    const response = await fetch(`${getOpaServerUrl()}/v1/policies`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    const data = await handleOpaResponse(response);

    if (typeof data === 'object' && data.result) {
        // Handle single policy with id field
        if (data.result.id) {
            return [{
                id: data.result.id,
                path: `/v1/policies/${data.result.id}`,
                size: data.result.raw?.length || 0
            }];
        }

        // Handle array of policies
        if (Array.isArray(data.result)) {
            return data.result.map((item: any, index: number) => ({
                id: item.id || item.name || `policy-${index}`,
                path: `/v1/policies/${item.id || item.name || `policy-${index}`}`,
                size: item.raw?.length || item.content?.length || 0
            }));
        }

        // Handle policies as object keys
        return Object.keys(data.result)
            .filter(id => id != null && id.trim() !== '')
            .map(id => ({
                id,
                path: `/v1/policies/${id}`,
                size: data.result[id]?.length || 0
            }));
    }

    return [];
}

export async function getPolicy(policyId: string): Promise<{ id: string; content: string; path: string }> {
    const response = await fetch(`${getOpaServerUrl()}/v1/policies/${policyId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    const data = await handleOpaResponse(response);

    let content = '';
    if (typeof data === 'string') {
        content = data;
    } else if (typeof data === 'object' && data !== null) {
        if (data.raw) {
            content = data.raw;
        } else if (data.result?.raw) {
            content = data.result.raw;
        } else if (typeof data.result === 'string') {
            content = data.result;
        } else {
            content = JSON.stringify(data.result || data, null, 2);
        }
    }

    return {
        id: policyId,
        content,
        path: `/v1/policies/${policyId}`,
    };
}

export async function createPolicy(policyId: string, content: string): Promise<void> {
    const response = await fetch(`${getOpaServerUrl()}/v1/policies/${encodeURIComponent(policyId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
        body: content,
    });

    await handleOpaResponse(response);
}

export async function deletePolicy(policyId: string): Promise<void> {
    if (!policyId || policyId.trim() === '') {
        throw new Error(`Invalid policy ID: "${policyId}"`);
    }

    const response = await fetch(`${getOpaServerUrl()}/v1/policies/${encodeURIComponent(policyId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });

    await handleOpaResponse(response);
}

// ============ Data Operations ============

export async function getAllData(): Promise<any> {
    const response = await fetch(`${getOpaServerUrl()}/v1/data`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    return await handleOpaResponse(response);
}

export async function getData(path: string): Promise<any> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    const response = await fetch(`${getOpaServerUrl()}/v1/data/${cleanPath}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    return await handleOpaResponse(response);
}

export async function putData(path: string, data: any): Promise<void> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    const response = await fetch(`${getOpaServerUrl()}/v1/data/${cleanPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    await handleOpaResponse(response);
}

export async function deleteData(path: string): Promise<void> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    const response = await fetch(`${getOpaServerUrl()}/v1/data/${cleanPath}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });

    await handleOpaResponse(response);
}

export async function patchData(path: string, data: any): Promise<void> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    const response = await fetch(`${getOpaServerUrl()}/v1/data/${cleanPath}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    await handleOpaResponse(response);
}

// ============ Query Operations ============

export async function queryData(path: string, input: any): Promise<any> {
    const response = await fetch(`${getOpaServerUrl()}/v1/data${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
    });

    return await handleOpaResponse(response);
}

// ============ Health & Metrics ============

export async function getHealth(): Promise<any> {
    const response = await fetch(`${getOpaServerUrl()}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    return await handleOpaResponse(response);
}

export async function getMetrics(): Promise<any> {
    const response = await fetch(`${getOpaServerUrl()}/metrics`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    return await handleOpaResponse(response);
}

// ============ Compile/Validate ============

export async function compilePolicy(policyContent: string): Promise<any> {
    const response = await fetch(`${getOpaServerUrl()}/v1/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: 'data',
            input: {},
            unknowns: [],
            modules: { 'policy.rego': policyContent }
        }),
    });

    return await handleOpaResponse(response);
}

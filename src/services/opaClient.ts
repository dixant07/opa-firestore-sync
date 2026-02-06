/* eslint-disable @typescript-eslint/no-explicit-any */
// OPA Client Service for UI components
// This client calls the centralized API routes

import { Policy, PolicyListItem } from '@/types/opa';

const API_BASE = '/api/opa';

export class OPAClient {
  // List all policies
  async listPolicies(): Promise<PolicyListItem[]> {
    const response = await fetch(`${API_BASE}/policies`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to list policies');
    }

    return data.result || [];
  }

  // Get a specific policy by ID
  async getPolicy(policyId: string): Promise<Policy> {
    const response = await fetch(`${API_BASE}/policies/${encodeURIComponent(policyId)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get policy');
    }

    return data.result;
  }

  // Create or update a policy
  async createPolicy(policyId: string, policyContent: string): Promise<void> {
    const response = await fetch(`${API_BASE}/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: policyId, content: policyContent }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create policy');
    }
  }

  // Update an existing policy
  async updatePolicy(policyId: string, policyContent: string): Promise<void> {
    const response = await fetch(`${API_BASE}/policies/${encodeURIComponent(policyId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: policyContent }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update policy');
    }
  }

  // Delete a policy
  async deletePolicy(policyId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/policies/${encodeURIComponent(policyId)}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete policy');
    }
  }

  // Query data against policies
  async queryData(path: string, input: any): Promise<any> {
    const response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, input }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to query data');
    }

    return data;
  }

  // Get OPA server health status
  async getHealth(): Promise<any> {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();

    if (!response.ok || data.status === 'error') {
      throw new Error(data.error || 'Health check failed');
    }

    return data;
  }

  // Compile a Rego policy (validate syntax)
  async compilePolicy(policyContent: string): Promise<any> {
    const response = await fetch(`${API_BASE}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: policyContent }),
    });

    const data = await response.json();
    if (!response.ok || !data.valid) {
      throw new Error(data.error || 'Compilation failed');
    }

    return data;
  }

  // Get all data from OPA
  async getAllData(): Promise<any> {
    const response = await fetch(`${API_BASE}/data`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get data');
    }

    return data;
  }

  // Get data from a specific path
  async getData(path: string): Promise<any> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const response = await fetch(`${API_BASE}/data/${cleanPath}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get data');
    }

    return data;
  }

  // Put data to a specific path
  async putData(path: string, value: any): Promise<void> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const response = await fetch(`${API_BASE}/data/${cleanPath}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to put data');
    }
  }

  // Delete data from a specific path
  async deleteData(path: string): Promise<void> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const response = await fetch(`${API_BASE}/data/${cleanPath}`, {
      method: 'DELETE',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete data');
    }
  }

  // Patch data at a specific path
  async patchData(path: string, value: any): Promise<void> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const response = await fetch(`${API_BASE}/data/${cleanPath}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to patch data');
    }
  }
}

// Export a default instance
export const opaClient = new OPAClient();
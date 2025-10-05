// OPA Client Service for managing policies on DigitalOcean server
const OPA_BASE_URL = '/api/opa';

export interface Policy {
  id: string;
  content: string;
  path: string;
  created?: string;
  modified?: string;
}

export interface PolicyListItem {
  id: string;
  path: string;
  size?: number;
}

export class OPAClient {
  private baseUrl: string;

  constructor(baseUrl: string = OPA_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Helper method to handle API responses
  private async handleResponse(response: Response) {
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

  // List all policies
  async listPolicies(): Promise<PolicyListItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/policies`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await this.handleResponse(response);
      console.log('Raw OPA response for listPolicies:', JSON.stringify(data, null, 2));
      
      // Handle different response structures from OPA server
      if (typeof data === 'object' && data.result) {
        console.log('data.result type:', typeof data.result);
        console.log('data.result is array:', Array.isArray(data.result));
        console.log('data.result keys:', Object.keys(data.result));
        console.log('data.result:', data.result);
        
        // Check if the response has a single policy with id field (your curl response structure)
        if (data.result.id) {
          console.log('Single policy response detected with id:', data.result.id);
          const policy = {
            id: data.result.id,
            path: `/v1/policies/${data.result.id}`,
            size: data.result.raw?.length || 0
          };
          console.log('Creating single policy object:', JSON.stringify(policy, null, 2));
          return [policy];
        }
        
        // Check if the response is an array of policies (alternative structure)
        if (Array.isArray(data.result)) {
          console.log('Array of policies detected, length:', data.result.length);
          const policies = data.result.map((item: any, index: number) => {
            const policyId = item.id || item.name || `policy-${index}`;
            const policy = {
              id: policyId,
              path: `/v1/policies/${policyId}`,
              size: item.raw?.length || item.content?.length || 0
            };
            console.log(`Creating policy object ${index}:`, JSON.stringify(policy, null, 2));
            return policy;
          });
          return policies;
        }
        
        // Handle the original structure where policies are keys in the result object
        const policyIds = Object.keys(data.result);
        console.log('Policy IDs from OPA server:', policyIds);
        console.log('Type of policyIds:', typeof policyIds, 'Array.isArray:', Array.isArray(policyIds));
        
        // Debug each policy ID
        policyIds.forEach((id, index) => {
          console.log(`Policy ${index}: id="${id}" (type: ${typeof id}), content length: ${data.result[id]?.length || 0}`);
        });
        
        const filteredPolicies = policyIds
          .filter(id => id != null && id.trim() !== '') // Only filter out null, undefined, or empty strings
          .map((id, index) => {
            const policy = {
              id,
              path: `/v1/policies/${id}`,
              size: data.result[id]?.length || 0
            };
            console.log(`Creating policy object ${index}:`, JSON.stringify(policy, null, 2));
            return policy;
          });
        
        console.log('Final filtered policies array:', JSON.stringify(filteredPolicies, null, 2));
        return filteredPolicies;
      }
      
      console.log('No policies found or invalid response structure');
      return [];
    } catch (error) {
      console.error('Error listing policies:', error);
      throw error;
    }
  }

  // Get a specific policy by ID
  async getPolicy(policyId: string): Promise<Policy> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/policies/${policyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await this.handleResponse(response);
      
      // Debug logging
      console.log('getPolicy response data:', JSON.stringify(data, null, 2));
      console.log('getPolicy data type:', typeof data);
      console.log('getPolicy data.result:', data.result);
      console.log('getPolicy data.result type:', typeof data.result);
      
      // Handle different response structures from OPA server
      let policyContent = '';
      
      if (typeof data === 'string') {
        // If data is a string, use it directly
        policyContent = data;
      } else if (typeof data === 'object' && data !== null) {
        // Check if the response has a 'raw' field containing the Rego content
        if (data.raw) {
          policyContent = data.raw;
        } else if (data.result) {
          // If data.result exists, check its type
          if (typeof data.result === 'string') {
            policyContent = data.result;
          } else if (typeof data.result === 'object') {
            // If data.result is an object, check if it has a 'raw' field
            if (data.result.raw) {
              policyContent = data.result.raw;
            } else {
              // If no 'raw' field, convert the entire result to JSON string
              policyContent = JSON.stringify(data.result, null, 2);
            }
          } else {
            // For any other type, convert to string
            policyContent = String(data.result);
          }
        } else {
          // If no data.result, convert the entire data object to JSON string
          policyContent = JSON.stringify(data, null, 2);
        }
      } else {
        // For any other type, convert to string
        policyContent = String(data || '');
      }
      
      return {
        id: policyId,
        content: policyContent,
        path: `/v1/policies/${policyId}`,
        created: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting policy ${policyId}:`, error);
      throw error;
    }
  }

  // Create or update a policy
  async createPolicy(policyId: string, policyContent: string): Promise<void> {
    try {
      console.log(`Creating policy with ID: "${policyId}" (type: ${typeof policyId})`);
      const url = `${this.baseUrl}/v1/policies/${encodeURIComponent(policyId)}`;
      console.log(`Request URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: policyContent,
      });

      await this.handleResponse(response);
      console.log(`Policy "${policyId}" created successfully`);
    } catch (error) {
      console.error(`Error creating/updating policy ${policyId}:`, error);
      throw error;
    }
  }

  // Update an existing policy
  async updatePolicy(policyId: string, policyContent: string): Promise<void> {
    return this.createPolicy(policyId, policyContent);
  }

  // Delete a policy
  async deletePolicy(policyId: string): Promise<void> {
    console.log(`deletePolicy called with policyId: "${policyId}" (type: ${typeof policyId})`);
    
    // Validate policy ID
    if (!policyId || policyId.trim() === '') {
      console.log('Policy ID validation failed in deletePolicy');
      throw new Error(`Invalid policy ID: "${policyId}". Cannot delete policy with invalid ID.`);
    }

    try {
      const url = `${this.baseUrl}/v1/policies/${encodeURIComponent(policyId)}`;
      console.log(`DELETE request URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await this.handleResponse(response);
      console.log(`Policy "${policyId}" deleted successfully`);
    } catch (error) {
      console.error(`Error deleting policy ${policyId}:`, error);
      throw error;
    }
  }

  // Query data against policies
  async queryData(path: string, input: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/data${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error querying data at ${path}:`, error);
      throw error;
    }
  }

  // Get OPA server health status
  async getHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error checking OPA health:', error);
      throw error;
    }
  }

  // Get OPA server metrics
  async getMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error getting OPA metrics:', error);
      throw error;
    }
  }

  // Compile a Rego policy (validate syntax)
  async compilePolicy(policyContent: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'data',
          input: {},
          unknowns: [],
          modules: {
            'policy.rego': policyContent
          }
        }),
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error compiling policy:', error);
      throw error;
    }
  }

  // Data Management Methods

  // Get all data from OPA
  async getAllData(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Error getting all data:', error);
      throw error;
    }
  }

  // Get data from a specific path
  async getData(path: string): Promise<any> {
    try {
      // Ensure path starts with /
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      
      const response = await fetch(`${this.baseUrl}/v1/data/${cleanPath}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error getting data from path ${path}:`, error);
      throw error;
    }
  }

  // Put data to a specific path
  async putData(path: string, data: any): Promise<void> {
    try {
      // Ensure path starts with /
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      
      const response = await fetch(`${this.baseUrl}/v1/data/${cleanPath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error(`Error putting data to path ${path}:`, error);
      throw error;
    }
  }

  // Delete data from a specific path
  async deleteData(path: string): Promise<void> {
    try {
      // Ensure path starts with /
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      
      const response = await fetch(`${this.baseUrl}/v1/data/${cleanPath}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting data from path ${path}:`, error);
      throw error;
    }
  }

  // Patch data at a specific path (partial update)
  async patchData(path: string, data: any): Promise<void> {
    try {
      // Ensure path starts with /
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      
      const response = await fetch(`${this.baseUrl}/v1/data/${cleanPath}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error(`Error patching data at path ${path}:`, error);
      throw error;
    }
  }
}

// Export a default instance
export const opaClient = new OPAClient();
// TypeScript types for OPA client

export interface Policy {
  id: string;
  content: string;
  path: string;
  created?: string;
  modified?: string;
  size?: number;
}

export interface PolicyListItem {
  id: string;
  path: string;
  size?: number;
}

export interface OPAResponse<T = any> {
  result?: T;
  decision_id?: string;
  provenance?: any;
  metrics?: any;
}

export interface QueryInput {
  input: any;
  path?: string;
}

export interface QueryResult {
  result: any;
  decision_id?: string;
  metrics?: any;
}

export interface CompileRequest {
  query: string;
  input: any;
  unknowns: string[];
  modules: Record<string, string>;
}

export interface CompileResult {
  result: {
    queries: any[];
    support: any[];
  };
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
}

export interface PolicyError {
  code: string;
  message: string;
  location?: {
    file: string;
    row: number;
    col: number;
  };
}

export interface PolicyValidationResult {
  valid: boolean;
  errors?: PolicyError[];
  warnings?: PolicyError[];
}

// UI State types
export interface UIState {
  loading: boolean;
  error: string | null;
  selectedPolicy: Policy | null;
  policies: PolicyListItem[];
}

export interface PolicyFormData {
  id: string;
  content: string;
}

export interface QueryFormData {
  path: string;
  input: string; // JSON string
}
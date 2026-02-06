'use client';

import { useState, useEffect } from 'react';
import { opaClient } from '@/services/opaClient';
import { Policy } from '@/types/opa';
import { useNotifications } from './NotificationSystem';
import { ButtonSpinner } from './LoadingSpinner';

interface PolicyEditorProps {
  policyId?: string;
  onSave: () => void;
  onCancel: () => void;
}

export function PolicyEditor({ policyId, onSave, onCancel }: PolicyEditorProps) {
  const [policy, setPolicy] = useState<Policy>({
    id: policyId || '',
    content: '',
    path: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null);
  const { addNotification } = useNotifications();

  // Ensure policy content is always a string
  const safePolicyContent = typeof policy.content === 'string' ? policy.content : String(policy.content || '');

  useEffect(() => {
    if (policyId) {
      loadPolicy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyId]);

  const loadPolicy = async () => {
    if (!policyId) return;

    try {
      setLoading(true);
      setError(null);
      const loadedPolicy = await opaClient.getPolicy(policyId);

      // Debug logging
      console.log('Loaded policy:', JSON.stringify(loadedPolicy, null, 2));
      console.log('Policy content type:', typeof loadedPolicy.content);
      console.log('Policy content:', loadedPolicy.content);

      // Validate that content is a string
      if (typeof loadedPolicy.content !== 'string') {
        console.error('Policy content is not a string:', typeof loadedPolicy.content);
        throw new Error(`Invalid policy content type: expected string, got ${typeof loadedPolicy.content}`);
      }

      setPolicy(loadedPolicy);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load policy';
      console.error('Error loading policy:', errorMessage);
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!policy.id.trim()) {
      setError('Policy ID is required');
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Policy ID is required',
        duration: 3000
      });
      return;
    }

    if (!safePolicyContent.trim()) {
      setError('Policy content is required');
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Policy content is required',
        duration: 3000
      });
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (policyId) {
        // Update existing policy
        await opaClient.updatePolicy(policy.id, safePolicyContent);
        addNotification({
          type: 'success',
          title: 'Policy Updated',
          message: `Policy "${policy.id}" has been successfully updated.`,
          duration: 3000
        });
      } else {
        // Create new policy
        await opaClient.createPolicy(policy.id, safePolicyContent);
        addNotification({
          type: 'success',
          title: 'Policy Created',
          message: `Policy "${policy.id}" has been successfully created.`,
          duration: 3000
        });
      }
      onSave();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save policy';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!safePolicyContent.trim()) {
      setValidationResult({ valid: false, message: 'No content to validate' });
      return;
    }

    try {
      setValidating(true);
      await opaClient.compilePolicy(safePolicyContent);
      setValidationResult({ valid: true, message: 'Policy syntax is valid' });
    } catch (err) {
      setValidationResult({
        valid: false,
        message: err instanceof Error ? err.message : 'Validation failed'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([safePolicyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policy.id || 'policy'}.rego`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPolicy(prev => ({ ...prev, content }));

      // Auto-set policy ID from filename if not set
      if (!policy.id) {
        const filename = file.name.replace(/\.rego$/, '');
        setPolicy(prev => ({ ...prev, id: filename }));
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading policy...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {policyId ? `Edit Policy: ${policyId}` : 'Create New Policy'}
          </h2>
          <div className="flex space-x-2">
            <label className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors cursor-pointer">
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
              <input
                type="file"
                accept=".rego,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleDownload}
              disabled={!safePolicyContent.trim()}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {validationResult && (
          <div className={`mb-4 p-4 border rounded-md ${validationResult.valid
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
            }`}>
            <div className="flex">
              <svg
                className={`w-5 h-5 ${validationResult.valid ? 'text-green-400' : 'text-red-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {validationResult.valid ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
              </svg>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${validationResult.valid ? 'text-green-800' : 'text-red-800'
                  }`}>
                  {validationResult.valid ? 'Validation Successful' : 'Validation Failed'}
                </h3>
                <p className={`text-sm mt-1 ${validationResult.valid ? 'text-green-700' : 'text-red-700'
                  }`}>
                  {validationResult.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="policyId" className="block text-sm font-medium text-gray-700 mb-2">
              Policy ID
            </label>
            <input
              type="text"
              id="policyId"
              value={policy.id}
              onChange={(e) => setPolicy(prev => ({ ...prev, id: e.target.value }))}
              disabled={!!policyId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter policy ID (e.g., my-policy)"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="policyContent" className="block text-sm font-medium text-gray-700">
                Policy Content (Rego)
              </label>
              <button
                onClick={handleValidate}
                disabled={validating || !safePolicyContent.trim()}
                className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                    Validating...
                  </div>
                ) : (
                  'Validate'
                )}
              </button>
            </div>
            <textarea
              id="policyContent"
              value={safePolicyContent}
              onChange={(e) => setPolicy(prev => ({ ...prev, content: e.target.value }))}
              className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="package example

default allow = false

allow {
    input.method == &quot;GET&quot;
    input.path == [&quot;api&quot;, &quot;users&quot;]
}"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !policy.id.trim() || !safePolicyContent.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving && <ButtonSpinner size="sm" />}
            <span>{saving ? 'Saving...' : (policyId ? 'Update Policy' : 'Create Policy')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { opaClient } from '@/services/opaClient';
import { PolicyListItem } from '@/types/opa';
import { useNotifications } from './NotificationSystem';
import LoadingSpinner, { ButtonSpinner } from './LoadingSpinner';

interface PolicyListProps {
  onSelectPolicy: (policyId: string) => void;
  onCreateNew: () => void;
  refreshTrigger?: number;
}

export function PolicyList({ onSelectPolicy, onCreateNew, refreshTrigger }: PolicyListProps) {
  const [policies, setPolicies] = useState<PolicyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const policyList = await opaClient.listPolicies();
      console.log('PolicyList received policies:', JSON.stringify(policyList, null, 2));
      console.log('PolicyList policies array length:', policyList.length);
      policyList.forEach((policy, index) => {
        console.log(`PolicyList policy ${index}:`, JSON.stringify(policy, null, 2));
      });
      setPolicies(policyList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, [refreshTrigger]);

  const handleDelete = async (policyId: string) => {
    console.log(`handleDelete called with policyId: "${policyId}" (type: ${typeof policyId})`);
    
    // Validate policy ID before showing confirmation
    if (!policyId || policyId.trim() === '') {
      console.log('Policy ID validation failed - empty or invalid ID');
      addNotification({
        type: 'error',
        title: 'Invalid Policy',
        message: 'Cannot delete policy with invalid ID. Please refresh the policy list.',
        duration: 5000
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this policy?')) {
      return;
    }

    setDeletingPolicy(policyId);
    try {
      await opaClient.deletePolicy(policyId);
      await loadPolicies(); // Refresh the list
      addNotification({
        type: 'success',
        title: 'Policy Deleted',
        message: `Policy "${policyId}" has been successfully deleted.`,
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to delete policy:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: `Failed to delete policy "${policyId}": ${errorMessage}`,
        duration: 5000
      });
    } finally {
      setDeletingPolicy(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" text="Loading policies..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Policies</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPolicies}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">OPA Policies</h2>
          <button
            onClick={onCreateNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Policy
          </button>
        </div>
      </div>

      <div className="p-6">
        {policies.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No policies found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new policy.</p>
            <div className="mt-6">
              <button
                onClick={onCreateNew}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create your first policy
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
          {policies.map((policy, index) => {
            console.log(`Rendering policy at index ${index}:`, JSON.stringify(policy, null, 2));
            console.log(`Policy ID: "${policy.id}" (type: ${typeof policy.id})`);
            return (
            <div
              key={policy.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{policy.id}</h3>
                    <p className="text-sm text-gray-500">{policy.path}</p>
                    {policy.size && (
                      <p className="text-xs text-gray-400 mt-1">{policy.size} characters</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onSelectPolicy(policy.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      View/Edit
                    </button>
                    <button
                      onClick={() => handleDelete(policy.id)}
                      disabled={deletingPolicy === policy.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="Delete policy"
                    >
                      {deletingPolicy === policy.id ? (
                        <ButtonSpinner size="sm" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
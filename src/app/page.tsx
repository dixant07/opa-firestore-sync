'use client';

import { useState, useEffect } from 'react';
import { PolicyList } from '@/components/PolicyList';
import { PolicyEditor } from '@/components/PolicyEditor';
import { QueryTester } from '@/components/QueryTester';
import { DataManager } from '@/components/DataManager';
import { useNotifications } from '@/components/NotificationSystem';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AccessControlCenter } from '@/components/AccessControlCenter';
import { opaClient } from '@/services/opaClient';
import { Policy, HealthStatus } from '@/types/opa';

type ViewMode = 'list' | 'editor' | 'query' | 'data' | 'access';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const { addNotification } = useNotifications();

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      await opaClient.getHealth();
      setServerStatus('online');
      addNotification({
        type: 'success',
        title: 'Server Connected',
        message: 'Successfully connected to OPA server',
        duration: 3000
      });
    } catch (error) {
      setServerStatus('offline');
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: 'Unable to connect to OPA server. Please check if the server is running.',
        duration: 5000
      });
    }
  };

  const handleSelectPolicy = (policyId: string) => {
    setSelectedPolicyId(policyId);
    setViewMode('editor');
  };

  const handleCreateNew = () => {
    setSelectedPolicyId(undefined);
    setViewMode('editor');
  };

  const handleSave = () => {
    setRefreshTrigger(prev => prev + 1);
    setViewMode('list');
    setSelectedPolicyId(undefined);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedPolicyId(undefined);
  };

  const getStatusColor = () => {
    switch (serverStatus) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = () => {
    switch (serverStatus) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      default: return 'Checking...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">OPA Policy Manager</h1>
              <div className="ml-4 flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  serverStatus === 'online' ? 'bg-green-500' : 
                  serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className={`text-sm font-medium ${getStatusColor()}`}>
                  Server: {getStatusText()}
                </span>
                <button
                  onClick={checkServerStatus}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  title="Refresh server status"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">139.59.91.77:8181</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setViewMode('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Policies
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'editor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editor
            </button>
            <button
              onClick={() => setViewMode('query')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'query'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Query Tester
            </button>
            <button
              onClick={() => setViewMode('data')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              Data Manager
            </button>
            <button
              onClick={() => setViewMode('access')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                viewMode === 'access'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Access Control
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {serverStatus === 'offline' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Server Connection Error</h3>
                <p className="text-sm text-red-700 mt-1">
                  Cannot connect to OPA server at 139.59.91.77:8181. Please check if the server is running and accessible.
                </p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <PolicyList
            onSelectPolicy={handleSelectPolicy}
            onCreateNew={handleCreateNew}
            refreshTrigger={refreshTrigger}
          />
        )}

        {viewMode === 'editor' && (
          <PolicyEditor
            policyId={selectedPolicyId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        {viewMode === 'query' && (
          <QueryTester />
        )}

        {viewMode === 'data' && (
          <DataManager />
        )}

        {viewMode === 'access' && (
          <AccessControlCenter />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              OPA Policy Manager - Connected to DigitalOcean Server
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <a 
                href="https://www.openpolicyagent.org/docs/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                OPA Documentation
              </a>
              <a 
                href="https://www.openpolicyagent.org/docs/latest/policy-language/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                Rego Language
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

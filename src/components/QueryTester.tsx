/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { opaClient } from '@/services/opaClient';
import { QueryResult } from '@/types/opa';
import { useNotifications } from './NotificationSystem';
import { ButtonSpinner } from './LoadingSpinner';

interface QueryTesterProps {
  className?: string;
}

export function QueryTester({ className = '' }: QueryTesterProps) {
  const [queryPath, setQueryPath] = useState('/example/allow');
  const [inputData, setInputData] = useState('{\n  "method": "GET",\n  "path": ["api", "users"],\n  "user": {\n    "id": "alice",\n    "role": "admin"\n  }\n}');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const handleQuery = async () => {
    if (!queryPath.trim()) {
      setError('Query path is required');
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Query path is required',
        duration: 3000
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse input data
      let parsedInput;
      try {
        parsedInput = JSON.parse(inputData);
      } catch (parseError) {
        throw new Error('Invalid JSON input data');
      }

      const queryResult = await opaClient.queryData(queryPath, parsedInput);
      setResult(queryResult);
      addNotification({
        type: 'success',
        title: 'Query Executed',
        message: 'Query executed successfully',
        duration: 3000
      });
    } catch (error) {
      console.error('Query failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Query failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Query Failed',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const handleFormatInput = () => {
    try {
      const parsed = JSON.parse(inputData);
      setInputData(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Query Tester</h2>
        <p className="text-sm text-gray-600 mt-1">Test your OPA policies with custom input data</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label htmlFor="queryPath" className="block text-sm font-medium text-gray-700 mb-2">
                Query Path
              </label>
              <input
                type="text"
                id="queryPath"
                value={queryPath}
                onChange={(e) => setQueryPath(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/example/allow"
              />
              <p className="text-xs text-gray-500 mt-1">
                Path to query in your OPA policies (e.g., /example/allow)
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="inputData" className="block text-sm font-medium text-gray-700">
                  Input Data (JSON)
                </label>
                <button
                  onClick={handleFormatInput}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  Format JSON
                </button>
              </div>
              <textarea
                id="inputData"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter JSON input data..."
              />
            </div>

            <button
              onClick={handleQuery}
              disabled={loading || !queryPath.trim() || !inputData.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading && <ButtonSpinner size="sm" />}
              <span>{loading ? 'Executing...' : 'Execute Query'}</span>
            </button>
          </div>

          {/* Result Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Query Result</h3>
            <div className="border border-gray-300 rounded-md h-80 overflow-auto">
              {result ? (
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                      {formatJson(result)}
                    </pre>
                  </div>

                  {result.result !== undefined && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Decision:</h4>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${result.result === true
                          ? 'bg-green-100 text-green-800'
                          : result.result === false
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                        {result.result === true ? (
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : result.result === false ? (
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : null}
                        {String(result.result)}
                      </div>
                    </div>
                  )}

                  {result.decision_id && (
                    <div className="text-xs text-gray-500">
                      Decision ID: {result.decision_id}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="mt-2 text-sm">Execute a query to see results</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Example Queries */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Example Queries:</h4>
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-mono bg-white px-2 py-1 rounded">/example/allow</span>
              <span className="text-gray-600 ml-2">- Check if action is allowed</span>
            </div>
            <div>
              <span className="font-mono bg-white px-2 py-1 rounded">/example/violations</span>
              <span className="text-gray-600 ml-2">- Get policy violations</span>
            </div>
            <div>
              <span className="font-mono bg-white px-2 py-1 rounded">/data</span>
              <span className="text-gray-600 ml-2">- Get all data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
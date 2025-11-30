'use client';

import { useState, useEffect } from 'react';
import { opaClient } from '@/services/opaClient';
import { useNotifications } from './NotificationSystem';
import LoadingSpinner, { ButtonSpinner } from './LoadingSpinner';

interface DataManagerProps {
  refreshTrigger?: number;
}

interface DataItem {
  path: string;
  data: any;
  size: number;
}

export function DataManager({ refreshTrigger }: DataManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [selectedDataPath, setSelectedDataPath] = useState<string>('');
  const [jsonInput, setJsonInput] = useState<string>('');
  const [newPath, setNewPath] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewingData, setViewingData] = useState<any>(null);
  const [viewingPath, setViewingPath] = useState<string>('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadAllData();
  }, [refreshTrigger]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const allData = await opaClient.getAllData();
      
      // Convert the nested data structure to a flat list of data items
      const items: DataItem[] = [];
      
      const extractPaths = (obj: any, currentPath: string = '') => {
        if (obj && typeof obj === 'object' && obj.result) {
          extractPaths(obj.result, currentPath);
        } else if (obj && typeof obj === 'object') {
          Object.keys(obj).forEach(key => {
            const newPath = currentPath ? `${currentPath}/${key}` : key;
            const value = obj[key];
            
            if (value && typeof value === 'object') {
              items.push({
                path: newPath,
                data: value,
                size: JSON.stringify(value).length
              });
              
              // Recursively extract nested paths
              extractPaths(value, newPath);
            }
          });
        }
      };
      
      extractPaths(allData);
      setDataItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const validateJSON = (jsonString: string): { isValid: boolean; error?: string; formatted?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      return { isValid: true, formatted };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
      // Provide more helpful error messages
      let friendlyError = errorMessage;
      if (errorMessage.includes('Unexpected token')) {
        friendlyError = 'Syntax error: Check for missing commas, quotes, or brackets';
      } else if (errorMessage.includes('Unexpected end of JSON input')) {
        friendlyError = 'Incomplete JSON: Missing closing brackets or quotes';
      }
      return { 
        isValid: false, 
        error: friendlyError
      };
    }
  };

  const handleFormatJSON = () => {
    const validation = validateJSON(jsonInput);
    if (validation.isValid && validation.formatted) {
      setJsonInput(validation.formatted);
      addNotification({
        type: 'success',
        title: 'JSON Formatted',
        message: 'JSON has been formatted successfully',
        duration: 2000
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Format Failed',
        message: validation.error || 'Invalid JSON cannot be formatted',
      });
    }
  };

  const handleViewData = async (path: string) => {
    try {
      const data = await opaClient.getData(path);
      setViewingData(data);
      setViewingPath(path);
      addNotification({
        type: 'success',
        title: 'Data Loaded',
        message: `Successfully loaded data from ${path}`,
        duration: 2000
      });
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: err instanceof Error ? err.message : 'Failed to load data',
      });
    }
  };

  const handleUploadData = async () => {
    if (!newPath.trim() || !jsonInput.trim()) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please provide both path and JSON data',
      });
      return;
    }

    const validation = validateJSON(jsonInput);
    if (!validation.isValid) {
      addNotification({
        type: 'error',
        title: 'Invalid JSON',
        message: validation.error || 'Please provide valid JSON data',
      });
      return;
    }

    try {
      setUploading(true);
      const parsedData = JSON.parse(jsonInput);
      await opaClient.putData(newPath, parsedData);
      
      addNotification({
        type: 'success',
        title: 'Data Uploaded',
        message: `Successfully uploaded data to path: ${newPath}`,
      });
      
      setNewPath('');
      setJsonInput('');
      setShowAddForm(false);
      await loadAllData();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: err instanceof Error ? err.message : 'Failed to upload data',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteData = async (path: string) => {
    if (!confirm(`Are you sure you want to delete data at path: ${path}?`)) {
      return;
    }

    try {
      await opaClient.deleteData(path);
      addNotification({
        type: 'success',
        title: 'Data Deleted',
        message: `Successfully deleted data from path: ${path}`,
      });
      await loadAllData();
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: err instanceof Error ? err.message : 'Failed to delete data',
      });
    }
  };



  const loadSampleData = () => {
    const sampleData = {
      users: {
        "alice09@gmail.com": {
          roles: ["editor"]
        },
        "bob@example.com": {
          roles: ["viewer"]
        }
      },
      resources: {
        "dfei2928": {
          owner: "alice09@gmail.com",
          permissions: {
            editor: ["read", "write"],
            viewer: ["read"]
          }
        }
      }
    };
    
    setJsonInput(JSON.stringify(sampleData, null, 2));
    setNewPath('accesscontrol');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner size="lg" text="Loading data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">OPA Data Management</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {showAddForm ? 'Cancel' : 'Add Data'}
            </button>
            <button
              onClick={loadAllData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          Manage structured data that your OPA policies can reference. Data is stored in-memory on the OPA server.
        </p>
      </div>

      {/* Add Data Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Data</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="dataPath" className="block text-sm font-medium text-gray-700 mb-1">
                Data Path
              </label>
              <input
                id="dataPath"
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="e.g., users, resources, accesscontrol"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                The path where data will be stored (accessible via /v1/data/{'{path}'})
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="jsonData" className="block text-sm font-medium text-gray-700">
                  JSON Data
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleFormatJSON}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Format JSON
                  </button>
                  <button
                    onClick={loadSampleData}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Load Sample Data
                  </button>
                </div>
              </div>
              <textarea
                id="jsonData"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Enter valid JSON data..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUploadData}
                disabled={uploading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {uploading && <ButtonSpinner />}
                Upload Data
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadAllData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Data List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Stored Data</h3>
          <p className="text-sm text-gray-600 mt-1">
            {dataItems.length} data {dataItems.length === 1 ? 'item' : 'items'} found
          </p>
        </div>

        {dataItems.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-600 mb-4">
              Upload some structured data to get started with your OPA policies.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Your First Data
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dataItems.map((item, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 mb-1">
                      /{item.path}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Size: {item.size} bytes
                    </p>
                    <p className="text-xs text-gray-500">
                      Accessible via: <code className="bg-gray-100 px-1 rounded">/v1/data/{item.path}</code>
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewData(item.path)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteData(item.path)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Browser */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Browser</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Available Data Paths</h3>
            {dataItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No data found. Upload some data to get started.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dataItems.map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm text-blue-600">/{item.path}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {typeof item.data === 'object' ? 'Object' : typeof item.data} • 
                        {JSON.stringify(item.data).length} characters
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewData(item.path)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteData(item.path)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Viewer */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Data Viewer</h3>
            {viewingData ? (
              <div>
                <div className="mb-2">
                  <span className="text-sm text-gray-600">Path: </span>
                  <span className="font-mono text-sm text-blue-600">/{viewingPath}</span>
                </div>
                <pre className="bg-gray-50 p-4 rounded-md text-sm overflow-auto max-h-80 border text-gray-900">
                  {JSON.stringify(viewingData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-md text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">Select a data path to view its contents</p>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
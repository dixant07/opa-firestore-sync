'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useNotifications } from './NotificationSystem';
import { FirestoreService } from '@/firebase/firestore.service';
import { RolePermissionDoc } from '@/types/permissions';

const MODULES = ['hrm', 'finance', 'crm'];
const ROLES = ['Manager', 'Employee', 'XYZ'];
const CRUD_ACTIONS = ['create', 'read', 'update', 'delete'];

export function AccessControlCenter() {
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>('hrm');
  const [selectedRole, setSelectedRole] = useState<string>('Manager');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<{[key: string]: boolean}>({});
  const [originalPermissions, setOriginalPermissions] = useState<{[key: string]: boolean}>({});
  const [tenantId, setTenantId] = useState<string>('t_123');
  
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Load permissions when module or role changes
    loadPermissionsForRole();
  }, [selectedModule, selectedRole]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // TODO: Get tenantId from user context/auth
      // For now using default tenant
      setTenantId('t_123');
      initializePermissions();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load permission data'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPermissionsForRole = async () => {
    try {
      const firestoreService = new FirestoreService(
        `tenant/${tenantId}/module/${selectedModule}/role`
      );
      
      const doc = await firestoreService.getDocument(selectedRole);
      
      if (doc) {
        // Extract CRUD permissions from the document
        const perms: {[key: string]: boolean} = {};
        CRUD_ACTIONS.forEach(action => {
          perms[action] = (doc as any)[action] === true;
        });
        setPermissions(perms);
        setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
        setHasChanges(false);
      } else {
        // No permissions found, initialize empty
        initializePermissions();
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Silently fail and use empty permissions
      initializePermissions();
    }
  };

  const initializePermissions = () => {
    // Initialize permissions object with all CRUD actions
    const perms: {[key: string]: boolean} = {};
    CRUD_ACTIONS.forEach(action => {
      perms[action] = false; // Default all to false
    });
    setPermissions(perms);
    setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
  };

  const handleModuleChange = (module: string) => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!confirm) return;
    }
    setSelectedModule(module);
    // Loading will happen automatically via useEffect
  };

  const handleRoleChange = (role: string) => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!confirm) return;
    }
    setSelectedRole(role);
    // Loading will happen automatically via useEffect
  };

  const handlePermissionToggle = (action: string) => {
    const newPermissions = {
      ...permissions,
      [action]: !permissions[action]
    };
    setPermissions(newPermissions);
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Prepare the permission document
      const permissionDoc: RolePermissionDoc = {
        tenantId,
        moduleId: selectedModule,
        roleId: selectedRole,
        create: permissions['create'] || false,
        read: permissions['read'] || false,
        update: permissions['update'] || false,
        delete: permissions['delete'] || false,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current-user' // TODO: Get from auth context
      };

      // Save to Firebase
      const firestoreService = new FirestoreService(
        `tenant/${tenantId}/module/${selectedModule}/role`
      );
      
      console.log('Saving permissions to path:', `tenant/${tenantId}/module/${selectedModule}/role/${selectedRole}`);
      console.log('Permission document:', permissionDoc);
      
      await firestoreService.setDocument(selectedRole, permissionDoc);
      
      // Update local state
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setHasChanges(false);

      addNotification({
        type: 'success',
        title: 'Changes Saved',
        message: `Permissions for ${selectedRole} in ${selectedModule} saved successfully to Firebase`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving permissions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Full error details:', {
        message: errorMessage,
        error: error,
        tenantId,
        module: selectedModule,
        role: selectedRole
      });
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: `${errorMessage} - Check console for details`,
        duration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
    setHasChanges(false);
    addNotification({
      type: 'info',
      title: 'Changes Discarded',
      message: 'All changes have been discarded',
      duration: 2000
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading permissions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Control Center</h2>
        <p className="text-gray-600">
          Manage role-based permissions for each module. Select a module and role to configure CRUD permissions.
        </p>
      </div>

      {/* Selection Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Module Selection */}
          <div>
            <label htmlFor="module" className="block text-sm font-semibold text-gray-700 mb-3">
              Module
            </label>
            <select
              id="module"
              value={selectedModule}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-medium"
            >
              {MODULES.map(module => (
                <option key={module} value={module}>
                  {module.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-3">
              Role
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-medium"
            >
              {ROLES.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CRUD Permission Matrix */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            CRUD Permissions for {selectedRole} in {selectedModule.toUpperCase()}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Toggle each permission to allow or deny the action
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CRUD_ACTIONS.map(action => (
              <label
                key={action}
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <input
                  type="checkbox"
                  checked={permissions[action] || false}
                  onChange={() => handlePermissionToggle(action)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 font-medium text-gray-700 capitalize">
                  {action}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Permission Summary Table */}
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Permission</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {CRUD_ACTIONS.map(action => (
                <tr key={action} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">
                    {action}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions[action] || false}
                        onChange={() => handlePermissionToggle(action)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="ml-2">{permissions[action] ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      permissions[action]
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {permissions[action] ? '✓ Allowed' : '✗ Denied'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h4 className="font-semibold text-gray-900 mb-2">Current Configuration</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <p><span className="font-medium">Module:</span> {selectedModule.toUpperCase()}</p>
          <p><span className="font-medium">Role:</span> {selectedRole}</p>
          <p><span className="font-medium">Enabled Permissions:</span> {Object.values(permissions).filter(Boolean).length} / {CRUD_ACTIONS.length}</p>
        </div>
      </div>

      {/* Save/Discard Buttons */}
      {hasChanges && (
        <div className="flex justify-end space-x-3 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <button
            onClick={handleDiscardChanges}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              '✓ Save Changes'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
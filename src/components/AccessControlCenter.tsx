'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useNotifications } from './NotificationSystem';

interface Permission {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

interface Role {
  id: string;
  name: string;
  permissions: {
    [resource: string]: Permission;
  };
}

interface User {
  id: string;
  email: string;
  roles: string[];
}

interface Resource {
  id: string;
  name: string;
  type: string;
}

export function AccessControlCenter() {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch data from your Firebase function
      // const data = await fetch('your-cloud-function-url');
      
      // Temporary mock data
      setRoles([
        {
          id: 'admin',
          name: 'Administrator',
          permissions: {
            'users': { create: true, read: true, update: true, delete: true },
            'policies': { create: true, read: true, update: true, delete: true }
          }
        },
        {
          id: 'editor',
          name: 'Editor',
          permissions: {
            'users': { create: false, read: true, update: true, delete: false },
            'policies': { create: true, read: true, update: true, delete: false }
          }
        }
      ]);

      setUsers([
        { id: '1', email: 'admin@example.com', roles: ['admin'] },
        { id: '2', email: 'editor@example.com', roles: ['editor'] }
      ]);

      setResources([
        { id: 'users', name: 'Users', type: 'collection' },
        { id: 'policies', name: 'Policies', type: 'collection' }
      ]);

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load access control data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (
    roleId: string,
    resource: string,
    permission: keyof Permission,
    value: boolean
  ) => {
    try {
      // TODO: Update permission in your backend
      // await fetch('your-cloud-function-url', {
      //   method: 'POST',
      //   body: JSON.stringify({ roleId, resource, permission, value })
      // });

      // Update local state
      setRoles(currentRoles => 
        currentRoles.map(role => {
          if (role.id === roleId) {
            return {
              ...role,
              permissions: {
                ...role.permissions,
                [resource]: {
                  ...role.permissions[resource],
                  [permission]: value
                }
              }
            };
          }
          return role;
        })
      );

      addNotification({
        type: 'success',
        title: 'Permission Updated',
        message: `Successfully updated ${permission} permission for ${resource}`,
        duration: 2000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update permission'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading access control data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Control Center</h2>
        <p className="text-gray-600">
          Manage roles, permissions, and user access across your application.
        </p>
      </div>

      {/* Role Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Roles & Permissions</h3>
          <button
            onClick={() => {/* TODO: Implement role creation */}}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add New Role
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Role List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Choose a role...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* User List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Users with this role
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select user...</option>
              {users
                .filter(user => selectedRole && user.roles.includes(selectedRole))
                .map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email}
                  </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      {selectedRole && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Permission Matrix</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure access permissions for each resource
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Create
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Read
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Update
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.map(resource => {
                  const permissions = roles.find(r => r.id === selectedRole)?.permissions[resource.id] || {
                    create: false,
                    read: false,
                    update: false,
                    delete: false
                  };

                  return (
                    <tr key={resource.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                        <div className="text-sm text-gray-500">{resource.type}</div>
                      </td>
                      {(['create', 'read', 'update', 'delete'] as const).map(permission => (
                        <td key={permission} className="px-6 py-4 whitespace-nowrap">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={permissions[permission]}
                              onChange={(e) => handlePermissionChange(
                                selectedRole,
                                resource.id,
                                permission,
                                e.target.checked
                              )}
                              className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Effective Permissions */}
      {selectedUser && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Effective Permissions</h3>
          <div className="prose max-w-none">
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-gray-900">
              {JSON.stringify(
                users.find(u => u.id === selectedUser)?.roles.flatMap(
                  roleId => Object.values(roles.find(r => r.id === roleId)?.permissions || {})
                ),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
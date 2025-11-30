// Simple CRUD-based role permissions for modules


// Path: tenants/{tenantId}/modules/{moduleId}/roles/{roleId}/permissions

export interface CRUDPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissionDoc extends CRUDPermissions {
  tenantId: string;
  moduleId: string;
  roleId: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

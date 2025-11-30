import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

const OPA_BASE_URL = process.env.OPA_SERVER_URL || "http://139.59.91.77:8181";
const OPA_DATA_ENDPOINT = "/v1/data/permissions";
const TIMEOUT = 10000;

interface PermissionDocument {
  tenantId: string;
  moduleId: string;
  roleId: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface OPASyncPayload {
  action: "create" | "update" | "delete";
  timestamp: string;
  documentPath: string;
  tenantId: string;
  moduleId: string;
  roleId: string;
  permissions: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  metadata?: {
    updatedAt: string;
    updatedBy: string;
  };
}

/**
 * Helper function to send data to OPA server using putData endpoint
 */
async function syncToOPAServer(payload: OPASyncPayload): Promise<void> {
  try {
    logger.info("Syncing to OPA Server", {
      action: payload.action,
      tenant: payload.tenantId,
      module: payload.moduleId,
      role: payload.roleId
    });

    // Build the permission data structure
    const permissionData = {
      [payload.tenantId]: {
        [payload.moduleId]: {
          [payload.roleId]: {
            permissions: payload.permissions,
            updatedAt: payload.metadata?.updatedAt,
            updatedBy: payload.metadata?.updatedBy
          }
        }
      }
    };

    // Construct the OPA PUT endpoint
    const url = `${OPA_BASE_URL}${OPA_DATA_ENDPOINT}`;

    logger.info("Calling OPA endpoint", {
      url,
      dataPath: OPA_DATA_ENDPOINT
    });

    // Make PUT request to OPA server using putData endpoint
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(permissionData),
      signal: AbortSignal.timeout(TIMEOUT)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OPA Server responded with ${response.status}: ${errorText}`
      );
    }

    logger.info("Successfully synced to OPA Server", {
      action: payload.action,
      tenant: payload.tenantId
    });

  } catch (error) {
    logger.error("Failed to sync to OPA Server", {
      error: error instanceof Error ? error.message : String(error),
      payload
    });
    // Re-throw to allow retry logic if needed
    throw error;
  }
}

/**
 * Format document path for logging
 */
function formatDocPath(docPath: string): string {
  return docPath.replace(/\//g, " → ");
}


export const onPermissionCreated = onDocumentCreated(
  "tenant/{tenantId}/module/{moduleId}/role/{roleId}",
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        logger.warn("Document snapshot is empty");
        return;
      }

      const docData = snapshot.data() as PermissionDocument;
      const { tenantId, moduleId, roleId } = event.params;

      logger.info("Permission document created", {
        path: formatDocPath(event.document),
        tenant: tenantId,
        module: moduleId,
        role: roleId
      });

      // Build OPA sync payload
      const payload: OPASyncPayload = {
        action: "create",
        timestamp: new Date().toISOString(),
        documentPath: event.document,
        tenantId,
        moduleId,
        roleId,
        permissions: {
          create: docData.create || false,
          read: docData.read || false,
          update: docData.update || false,
          delete: docData.delete || false
        },
        metadata: {
          updatedAt: docData.updatedAt || new Date().toISOString(),
          updatedBy: docData.updatedBy || "system"
        }
      };

      // Sync to OPA
      await syncToOPAServer(payload);

    } catch (error) {
      logger.error("Error in onPermissionCreated", {
        error: error instanceof Error ? error.message : String(error),
        documentPath: event.document
      });
      // Note: Not re-throwing to prevent function failure
      // In production, consider setting up error notifications
    }
  }
);

/**
 * Cloud Function: Triggered when permission document is updated
 * Path: tenant/{tenantId}/{moduleId}/role/{roleId}
 */
export const onPermissionUpdated = onDocumentUpdated(
  "tenant/{tenantId}/module/{moduleId}/role/{roleId}",
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        logger.warn("Document snapshot is empty");
        return;
      }

      const docData = snapshot.after.data() as PermissionDocument;
      const { tenantId, moduleId, roleId } = event.params;

      logger.info("Permission document updated", {
        path: formatDocPath(event.document),
        tenant: tenantId,
        module: moduleId,
        role: roleId
      });

      // Build OPA sync payload
      const payload: OPASyncPayload = {
        action: "update",
        timestamp: new Date().toISOString(),
        documentPath: event.document,
        tenantId,
        moduleId,
        roleId,
        permissions: {
          create: docData.create || false,
          read: docData.read || false,
          update: docData.update || false,
          delete: docData.delete || false
        },
        metadata: {
          updatedAt: docData.updatedAt || new Date().toISOString(),
          updatedBy: docData.updatedBy || "system"
        }
      };

      // Sync to OPA
      await syncToOPAServer(payload);

    } catch (error) {
      logger.error("Error in onPermissionUpdated", {
        error: error instanceof Error ? error.message : String(error),
        documentPath: event.document
      });
      // Note: Not re-throwing to prevent function failure
    }
  }
);

/**
 * Cloud Function: Triggered when permission document is deleted
 * Path: tenant/{tenantId}/{moduleId}/role/{roleId}
 */
export const onPermissionDeleted = onDocumentDeleted(
  "tenant/{tenantId}/module/{moduleId}/role/{roleId}",
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot) {
        logger.warn("Document snapshot is empty");
        return;
      }

      const { tenantId, moduleId, roleId } = event.params;

      logger.info("Permission document deleted", {
        path: formatDocPath(event.document),
        tenant: tenantId,
        module: moduleId,
        role: roleId
      });

      // Build OPA sync payload
      const payload: OPASyncPayload = {
        action: "delete",
        timestamp: new Date().toISOString(),
        documentPath: event.document,
        tenantId,
        moduleId,
        roleId,
        permissions: {
          create: false,
          read: false,
          update: false,
          delete: false
        },
        metadata: {
          updatedAt: new Date().toISOString(),
          updatedBy: "system-delete"
        }
      };

      // Sync to OPA
      await syncToOPAServer(payload);

    } catch (error) {
      logger.error("Error in onPermissionDeleted", {
        error: error instanceof Error ? error.message : String(error),
        documentPath: event.document
      });
      // Note: Not re-throwing to prevent function failure
    }
  }
);

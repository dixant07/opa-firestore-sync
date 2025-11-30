import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FirestoreData, FirestoreCollection } from "./types/firestore_types.js";
import { onPermissionCreated, onPermissionUpdated, onPermissionDeleted } from "./opaSync.js";

// Initialize Firebase Admin
initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Export OPA Sync Cloud Functions
export { onPermissionCreated, onPermissionUpdated, onPermissionDeleted };

export const helloWorld = onRequest((req, res) => {
  logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from Firebase!");
});

export const getAllCollections = onRequest(async (req, res) => {
  try {
    // Get Firestore client
    const db = getFirestore();
    
    // Object to store all data
    const allData: FirestoreData = {};
    
    // Get all collections
    const collections = await db.listCollections();
    
    // Process each collection
    for (const collection of collections) {
      const collectionData: FirestoreCollection = {};
      
      // Get all documents in the collection
      const querySnapshot = await collection.get();
      
      // Process each document
      querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
        // Get document data
        const docData = doc.data();
        
        // Handle Timestamp objects (convert to ISO string)
        Object.keys(docData).forEach((key) => {
          if (docData[key] instanceof Timestamp) {
            docData[key] = docData[key].toDate().toISOString();
          }
        });
        
        // Store document data with its ID
        collectionData[doc.id] = docData;
      });
      
      // Store collection data
      allData[collection.id] = collectionData;
    }
    
    // Set response headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Content-Type", "application/json");
    
    // Send successful response
    res.status(200).send(JSON.stringify(allData, null, 2));
    
  } catch (error) {
    // Log the error
    logger.error("Error retrieving Firestore data:", error);
    
    // Set response headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Content-Type", "application/json");
    
    // Send error response
    res.status(500).send(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to retrieve Firestore data"
    }, null, 2));
  }
});

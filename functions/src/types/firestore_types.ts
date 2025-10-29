import { Timestamp } from "firebase-admin/firestore";

export interface FirestoreValue {
  string: string;
  number: number;
  boolean: boolean;
  timestamp: Timestamp;
  null: null;
  array: FirestoreValue[];
  map: { [key: string]: FirestoreValue };
}

export interface FirestoreDocument {
  [key: string]: string | number | boolean | Timestamp | null | FirestoreValue[] | { [key: string]: FirestoreValue };
}

export interface FirestoreCollection {
  [documentId: string]: FirestoreDocument;
}

export interface FirestoreData {
  [collectionId: string]: FirestoreCollection;
}
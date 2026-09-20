import { staticDb } from './staticDatabase';

// ─── Static DB Proxy ───────────────────────────────────────────
// We are completely bypassing Firebase and using a local static database for the hackathon.
// This ensures reactive state across all pages without needing a backend.

export const createDoc = async (colName, data) => {
  return staticDb.createDoc(colName, data);
}

export const createDocWithId = async (colName, id, data) => {
  return staticDb.createDocWithId(colName, id, data);
}

export const fetchDoc = async (colName, id) => {
  return staticDb.getDoc(colName, id);
}

export const patchDoc = async (colName, id, data) => {
  staticDb.patchDoc(colName, id, data);
}

export const removeDoc = async (colName, id) => {
  staticDb.deleteDoc(colName, id);
}

export const queryCollection = async (colName, constraints = [], sortBy = null, max = 100) => {
  return staticDb.queryCollection(colName, constraints, sortBy, max);
}

/**
 * Real-time listener on a collection with optional constraints.
 * Returns unsubscribe function.
 */
export const listenCollection = (colName, callback, constraints = [], sortBy = null, max = 200) => {
  // Initial fetch
  const updateData = () => {
    callback(staticDb.queryCollection(colName, constraints, sortBy, max));
  };
  updateData(); // Call immediately
  
  // Subscribe to changes
  return staticDb.subscribe(colName, updateData);
}

/**
 * Run a Firestore transaction.
 */
export const runTx = async (fn) => {
  console.warn("Transactions are stubbed out in static database");
  return null;
}

/**
 * Run a batch write.
 */
export const getBatch = () => {
  console.warn("Batches are stubbed out in static database");
  return null;
}

// Stub server timestamp
export const serverTimestamp = () => new Date().toISOString();

// Stub missing exports that might be imported elsewhere, although most services use the above
export const doc = () => {};
export const getDoc = () => {};
export const updateDoc = () => {};
export const collection = () => {};
export const query = () => {};
export const where = () => {};
export const orderBy = () => {};
export const getDocs = () => {};
export const runTransaction = () => {};

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch, runTransaction
} from "firebase/firestore"
import { db, isFirebaseConfigured } from "../firebase/firebase"

// ─── Generic helpers ───────────────────────────────────────────

export const getCollection = (name) => collection(db, name)
export const getDocRef = (colName, id) => doc(db, colName, id)

export const createDoc = async (colName, data) => {
  if (!isFirebaseConfigured || !db) return null
  const ref = await addDoc(collection(db, colName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export const createDocWithId = async (colName, id, data) => {
  if (!isFirebaseConfigured || !db) return null
  await setDoc(doc(db, colName, id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return id
}

export const fetchDoc = async (colName, id) => {
  if (!isFirebaseConfigured || !db) return null
  const snap = await getDoc(doc(db, colName, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const patchDoc = async (colName, id, data) => {
  if (!isFirebaseConfigured || !db) return
  await updateDoc(doc(db, colName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const removeDoc = async (colName, id) => {
  if (!isFirebaseConfigured || !db) return
  await deleteDoc(doc(db, colName, id))
}

export const queryCollection = async (colName, constraints = [], sortBy = null, max = 100) => {
  if (!isFirebaseConfigured || !db) return []
  const parts = constraints.map(c => where(c.field, c.op, c.value))
  if (sortBy) parts.push(orderBy(sortBy.field, sortBy.dir || "asc"))
  parts.push(limit(max))
  const q = query(collection(db, colName), ...parts)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Real-time listener on a collection with optional constraints.
 * Returns unsubscribe function.
 */
export const listenCollection = (colName, callback, constraints = [], sortBy = null, max = 200) => {
  if (!isFirebaseConfigured || !db) {
    callback([])
    return () => {}
  }
  const parts = constraints.map(c => where(c.field, c.op, c.value))
  if (sortBy) parts.push(orderBy(sortBy.field, sortBy.dir || "asc"))
  parts.push(limit(max))
  const q = query(collection(db, colName), ...parts)
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  }, (err) => {
    console.error(`Firestore listen error [${colName}]:`, err)
    callback([])
  })
}

/**
 * Run a Firestore transaction.
 */
export const runTx = async (fn) => {
  if (!isFirebaseConfigured || !db) return null
  return runTransaction(db, fn)
}

/**
 * Run a batch write.
 */
export const getBatch = () => {
  if (!isFirebaseConfigured || !db) return null
  return writeBatch(db)
}

export { serverTimestamp, doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs, runTransaction }

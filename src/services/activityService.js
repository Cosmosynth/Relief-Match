import { createDoc, listenCollection } from "./firestoreService"

/**
 * Log an activity event (visible in Command Center feed and as notifications).
 */
export const logActivity = async (type, message, severity = "info", refId = null, actorUid = null) => {
  try {
    await createDoc("activity", {
      type,
      message,
      severity, // info, success, warning, error
      refId,
      actorUid: actorUid || "system",
    })
  } catch (e) {
    console.warn("[Activity] Write failed:", e.message)
  }
}

/**
 * Real-time listener for activity feed.
 */
export const listenToActivity = (callback, max = 50) => {
  return listenCollection("activity", callback, [], { field: "createdAt", dir: "desc" }, max)
}

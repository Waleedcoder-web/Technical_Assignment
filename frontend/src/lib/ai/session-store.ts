import { PropertySearchParams } from "./property-search";

export interface ChatSession {
  sessionId: string;
  pendingSearchParams: PropertySearchParams | null;
  requiresClarification: boolean;
  lastUpdated: number;
}

// In-memory session cache (scoped to server process)
const sessions = new Map<string, ChatSession>();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Retrieves session state for a given sessionId.
 * Falls back to "default-session" when no specific sessionId is provided.
 */
export function getSession(sessionId: string = "default-session"): ChatSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (Date.now() - session.lastUpdated > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

/**
 * Persists or updates the pending property search parameters in session memory.
 */
export function saveSession(
  sessionId: string = "default-session",
  pendingSearchParams: PropertySearchParams | null,
  requiresClarification: boolean = false
): void {
  sessions.set(sessionId, {
    sessionId,
    pendingSearchParams,
    requiresClarification,
    lastUpdated: Date.now(),
  });
}

/**
 * Explicitly clears the pending search state for a session.
 */
export function clearSession(sessionId: string = "default-session"): void {
  sessions.delete(sessionId);
}

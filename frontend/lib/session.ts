/**
 * Client-side session state management for Account Abstraction.
 *
 * Sessions are created on-chain (single Freighter approval) and
 * tracked locally in localStorage. Subsequent tool uses check
 * the local session state to bypass the x402/Freighter flow.
 */

const SESSION_STORAGE_KEY = "flashpay_session";

export interface SessionState {
  ownerAddress: string;
  budgetTotal: number;       // USDC
  budgetRemaining: number;   // USDC (client-tracked, source of truth is on-chain)
  maxPerTx: number;          // USDC
  expiresAt: number;         // Unix ms
  createdAt: number;         // Unix ms
}

/**
 * Returns the active session or null if none/expired/exhausted.
 */
export function getActiveSession(): SessionState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session: SessionState = JSON.parse(stored);

    // Auto-expire
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    // Auto-exhaust
    if (session.budgetRemaining <= 0) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Persist session state to localStorage.
 */
export function saveSession(session: SessionState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Remove session state from localStorage.
 */
export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Deduct a tool usage from the local session budget.
 */
export function deductSessionBudget(amount: number): void {
  const session = getActiveSession();
  if (!session) return;

  session.budgetRemaining = Math.max(0, session.budgetRemaining - amount);
  saveSession(session);
}

/**
 * Check if an active session exists.
 */
export function hasActiveSession(): boolean {
  return getActiveSession() !== null;
}

/**
 * Remaining uses estimate based on largest tool price.
 */
export function estimateRemainingUses(session: SessionState): number {
  if (session.maxPerTx <= 0) return 0;
  return Math.floor(session.budgetRemaining / session.maxPerTx);
}

/**
 * Remaining time in human-readable form.
 */
export function formatTimeRemaining(session: SessionState): string {
  const ms = session.expiresAt - Date.now();
  if (ms <= 0) return "Expired";

  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m left`;
}

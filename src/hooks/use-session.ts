'use client';

/**
 * useSession Hook
 *
 * Manages session persistence for the LazorKit wallet.
 * Stores session state in localStorage and attempts to reconnect
 * automatically when the user returns to the page.
 *
 * Features:
 * - Automatic session save on connection
 * - Auto-reconnect on page load (if session is valid)
 * - Session expiry (default: 24 hours)
 * - Manual session clearing
 *
 * @example
 * ```tsx
 * import { useSession } from '@/hooks/use-session';
 *
 * function App() {
 *   const { isRestoring, clearSession, sessionInfo } = useSession();
 *
 *   if (isRestoring) return <span>Restoring session...</span>;
 *   return <div>Session active: {sessionInfo?.connected}</div>;
 * }
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';

const SESSION_KEY = 'lazorkit-session';
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionData {
  /** Whether the wallet was connected */
  connected: boolean;
  /** Timestamp when session was created */
  timestamp: number;
  /** Smart wallet address (for verification) */
  walletAddress?: string;
}

interface UseSessionReturn {
  /** Whether session restoration is in progress */
  isRestoring: boolean;
  /** Current session info (null if no session) */
  sessionInfo: SessionData | null;
  /** Clear the stored session */
  clearSession: () => void;
  /** Check if session is valid */
  isSessionValid: boolean;
}

export function useSession(expiryMs: number = DEFAULT_EXPIRY_MS): UseSessionReturn {
  const { isConnected, smartWalletPubkey, connect } = useWallet();
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionData | null>(null);

  /**
   * Save session to localStorage
   */
  const saveSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    const session: SessionData = {
      connected: true,
      timestamp: Date.now(),
      walletAddress: smartWalletPubkey?.toBase58(),
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setSessionInfo(session);
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }, [smartWalletPubkey]);

  /**
   * Load session from localStorage
   */
  const loadSession = useCallback((): SessionData | null => {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return null;

      const session: SessionData = JSON.parse(saved);
      return session;
    } catch {
      return null;
    }
  }, []);

  /**
   * Check if a session is valid (not expired)
   */
  const isValidSession = useCallback(
    (session: SessionData | null): boolean => {
      if (!session || !session.connected) return false;
      const age = Date.now() - session.timestamp;
      return age < expiryMs;
    },
    [expiryMs]
  );

  /**
   * Clear stored session
   */
  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(SESSION_KEY);
      setSessionInfo(null);
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }, []);

  // Save session when connected
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      saveSession();
    }
  }, [isConnected, smartWalletPubkey, saveSession]);

  // Attempt to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const session = loadSession();
      setSessionInfo(session);

      if (isValidSession(session)) {
        try {
          // Attempt to reconnect using the stored session
          await connect();
        } catch (error) {
          console.warn('Session restore failed:', error);
          // Clear invalid session
          clearSession();
        }
      } else if (session) {
        // Session exists but is expired
        clearSession();
      }

      setIsRestoring(false);
    };

    restoreSession();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isRestoring,
    sessionInfo,
    clearSession,
    isSessionValid: isValidSession(sessionInfo),
  };
}

'use client';

/**
 * useBalance Hook
 *
 * Fetches and manages SOL balance for the connected wallet.
 * Includes auto-refresh functionality and loading states.
 *
 * @example
 * ```tsx
 * import { useBalance } from '@/hooks/use-balance';
 *
 * function BalanceDisplay() {
 *   const { balance, isLoading, refetch } = useBalance();
 *
 *   if (isLoading) return <span>Loading...</span>;
 *   return <span>{balance} SOL</span>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { env } from '@/config/env';

interface UseBalanceReturn {
  /** SOL balance (null if not fetched yet) */
  balance: number | null;
  /** Balance in lamports */
  balanceLamports: number | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refetch the balance */
  refetch: () => Promise<void>;
}

export function useBalance(autoRefreshMs?: number): UseBalanceReturn {
  const { smartWalletPubkey, isConnected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!isConnected || !smartWalletPubkey) {
      setBalance(null);
      setBalanceLamports(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const connection = new Connection(env.RPC_URL, 'confirmed');
      const lamports = await connection.getBalance(smartWalletPubkey);

      setBalanceLamports(lamports);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [smartWalletPubkey, isConnected]);

  // Fetch balance on mount and when wallet changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh balance at specified interval
  useEffect(() => {
    if (!autoRefreshMs || !isConnected) return;

    const interval = setInterval(fetchBalance, autoRefreshMs);
    return () => clearInterval(interval);
  }, [autoRefreshMs, isConnected, fetchBalance]);

  return {
    balance,
    balanceLamports,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}

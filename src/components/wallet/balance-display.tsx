'use client';

/**
 * Balance Display Component
 *
 * Displays the SOL balance of the connected wallet with:
 * - Auto-refresh functionality
 * - Loading and error states
 * - Manual refresh button
 *
 * @example
 * ```tsx
 * import { BalanceDisplay } from '@/components/wallet/balance-display';
 *
 * export default function WalletPage() {
 *   return <BalanceDisplay />;
 * }
 * ```
 */

import { useBalance } from '@/hooks/use-balance';
import { useWallet } from '@lazorkit/wallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Coins, AlertCircle } from 'lucide-react';

interface BalanceDisplayProps {
  /** Auto-refresh interval in milliseconds (default: 30000 - 30 seconds) */
  autoRefreshMs?: number;
}

export function BalanceDisplay({ autoRefreshMs = 30000 }: BalanceDisplayProps) {
  const { isConnected } = useWallet();
  const { balance, isLoading, error, refetch } = useBalance(autoRefreshMs);

  // Not connected state
  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Connect wallet to view balance
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Balance
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            disabled={isLoading}
            title="Refresh balance"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
        <CardDescription>Your SOL balance on Devnet</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && balance === null ? (
          <Skeleton className="h-12 w-32" />
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl font-bold">
              {balance !== null ? balance.toFixed(4) : '0.0000'}
              <span className="text-lg font-normal text-muted-foreground ml-2">
                SOL
              </span>
            </div>
            {balance !== null && balance < 0.01 && (
              <p className="text-sm text-muted-foreground">
                Low balance. Get Devnet SOL from a{' '}
                <a
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  faucet
                </a>
                .
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

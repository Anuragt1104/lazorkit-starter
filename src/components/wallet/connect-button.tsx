'use client';

/**
 * Connect Button Component
 *
 * The primary interface for wallet connection using passkeys.
 * This component handles:
 * - Triggering the passkey authentication flow
 * - Displaying connection status
 * - Showing the truncated wallet address when connected
 * - Disconnect functionality
 *
 * @example
 * ```tsx
 * import { ConnectButton } from '@/components/wallet/connect-button';
 *
 * export default function Header() {
 *   return (
 *     <header>
 *       <ConnectButton />
 *     </header>
 *   );
 * }
 * ```
 */

import { useWallet } from '@lazorkit/wallet';
import { Button } from '@/components/ui/button';
import { Loader2, Fingerprint, LogOut } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function ConnectButton() {
  const {
    smartWalletPubkey,
    isConnected,
    isConnecting,
    isLoading,
    connect,
    disconnect,
  } = useWallet();

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  /**
   * Handle wallet connection via passkey
   * This triggers the browser's WebAuthn prompt
   */
  const handleConnect = useCallback(async () => {
    try {
      await connect();
      toast.success('Wallet connected successfully!');
    } catch (error: unknown) {
      console.error('Connection failed:', error);

      // Categorize errors for better UX
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Connection cancelled by user');
        } else if (error.name === 'SecurityError') {
          toast.error('Security error - check your domain configuration');
        } else {
          toast.error(error.message || 'Failed to connect wallet');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  }, [connect]);

  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnect();
      toast.info('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast.error('Failed to disconnect wallet');
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnect]);

  /**
   * Format wallet address for display
   */
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Loading state (initial SDK load)
  if (isLoading) {
    return (
      <Button disabled variant="outline" size="lg">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Connecting state (passkey prompt active)
  if (isConnecting) {
    return (
      <Button disabled size="lg" className="bg-primary">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Authenticating...
      </Button>
    );
  }

  // Connected state
  if (isConnected && smartWalletPubkey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-mono text-sm">
            {formatAddress(smartWalletPubkey.toBase58())}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          title="Disconnect wallet"
        >
          {isDisconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // Disconnected state
  return (
    <Button onClick={handleConnect} size="lg" className="gap-2">
      <Fingerprint className="h-5 w-5" />
      Connect with Passkey
    </Button>
  );
}

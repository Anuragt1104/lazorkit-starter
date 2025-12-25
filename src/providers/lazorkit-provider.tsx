'use client';

/**
 * LazorKit Provider Wrapper
 *
 * This component wraps the application with the LazorKitProvider,
 * enabling passkey authentication and smart wallet functionality
 * throughout the app.
 *
 * The provider handles:
 * - WebAuthn/Passkey credential management
 * - Smart wallet state (connection, signing)
 * - Communication with the paymaster for gasless transactions
 */

import { LazorkitProvider } from '@lazorkit/wallet';
import { ReactNode, useMemo } from 'react';
import { env } from '@/config/env';

interface LazorKitWrapperProps {
  children: ReactNode;
}

export function LazorKitWrapper({ children }: LazorKitWrapperProps) {
  // Memoize configuration to prevent unnecessary re-renders
  const config = useMemo(
    () => ({
      rpcUrl: env.RPC_URL,
      portalUrl: env.PORTAL_URL,
      paymasterConfig: {
        paymasterUrl: env.PAYMASTER_URL,
      },
    }),
    []
  );

  return (
    <LazorkitProvider
      rpcUrl={config.rpcUrl}
      portalUrl={config.portalUrl}
      paymasterConfig={config.paymasterConfig}
    >
      {children}
    </LazorkitProvider>
  );
}

/**
 * Re-export the useWallet hook for convenience
 * This allows components to import from a single location
 */
export { useWallet } from '@lazorkit/wallet';

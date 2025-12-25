'use client';

/**
 * Wallet Demo Page
 *
 * Demonstrates passkey-based wallet connection and displays wallet information.
 */

import { WalletInfo, BalanceDisplay, ConnectButton } from '@/components/wallet';
import { useWallet } from '@lazorkit/wallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Fingerprint, Info } from 'lucide-react';

export default function WalletDemoPage() {
  const { isConnected } = useWallet();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet Connection</h1>
        <p className="text-muted-foreground">
          Connect your wallet using passkey authentication (FaceID, TouchID, or
          Windows Hello)
        </p>
      </div>

      {/* How It Works */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How Passkey Wallets Work</AlertTitle>
        <AlertDescription>
          When you connect, your device generates a cryptographic keypair stored
          in its Secure Enclave. The private key never leaves your device. A
          smart wallet (PDA) is created on Solana that recognizes your passkey
          signature.
        </AlertDescription>
      </Alert>

      {/* Connect Section */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Connect Your Wallet
            </CardTitle>
            <CardDescription>
              Click the button below to authenticate with your device&apos;s
              biometric sensor
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <ConnectButton />
          </CardContent>
        </Card>
      )}

      {/* Wallet Details */}
      {isConnected && (
        <div className="grid gap-6 lg:grid-cols-2">
          <WalletInfo />
          <BalanceDisplay />
        </div>
      )}

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
          <CardDescription>
            How to implement wallet connection in your app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { useWallet } from '@lazorkit/wallet';

function ConnectButton() {
  const { connect, disconnect, isConnected, smartWalletPubkey } = useWallet();

  if (isConnected) {
    return (
      <div>
        <p>Connected: {smartWalletPubkey?.toBase58()}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return <button onClick={connect}>Connect with Passkey</button>;
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

# Tutorial 1: Passkey Wallet Creation

Learn how to implement passkey-based wallet authentication in your Solana dApp using LazorKit.

## What You'll Learn

- How passkey authentication works
- Setting up the LazorKit provider
- Creating a connect button component
- Displaying wallet information

## Prerequisites

- Node.js 18+
- A project with React/Next.js
- Basic understanding of React hooks

## Understanding Passkeys

Passkeys use the WebAuthn standard to create secure, phishing-resistant authentication. When a user creates a passkey:

1. The device generates a cryptographic keypair
2. The private key is stored in the device's Secure Enclave (never leaves the device)
3. The public key is registered with the application
4. On Solana, a smart wallet (PDA) is created that recognizes this passkey

## Step 1: Install Dependencies

```bash
npm install @lazorkit/wallet @coral-xyz/anchor @solana/web3.js
```

## Step 2: Set Up Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PORTAL_URL=https://portal.lazor.sh
NEXT_PUBLIC_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
```

## Step 3: Create the LazorKit Provider

```typescript
// src/providers/lazorkit-provider.tsx
'use client';

import { LazorKitProvider } from '@lazorkit/wallet';
import { ReactNode } from 'react';

interface LazorKitWrapperProps {
  children: ReactNode;
}

export function LazorKitWrapper({ children }: LazorKitWrapperProps) {
  return (
    <LazorKitProvider
      rpcUrl={process.env.NEXT_PUBLIC_RPC_URL!}
      portalUrl={process.env.NEXT_PUBLIC_PORTAL_URL!}
      paymasterUrl={process.env.NEXT_PUBLIC_PAYMASTER_URL!}
    >
      {children}
    </LazorKitProvider>
  );
}
```

## Step 4: Wrap Your App

```typescript
// src/app/layout.tsx
import { LazorKitWrapper } from '@/providers/lazorkit-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <LazorKitWrapper>
          {children}
        </LazorKitWrapper>
      </body>
    </html>
  );
}
```

## Step 5: Create the Connect Button

```typescript
// src/components/wallet/connect-button.tsx
'use client';

import { useWallet } from '@lazorkit/wallet';
import { useCallback, useState } from 'react';

export function ConnectButton() {
  const {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    smartWalletPubkey,
    error
  } = useWallet();

  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    try {
      setConnectError(null);
      await connect();
    } catch (err) {
      // Categorize errors for better UX
      if (err instanceof Error) {
        if (err.message.includes('cancelled') || err.message.includes('abort')) {
          setConnectError('Connection cancelled');
        } else if (err.message.includes('not supported')) {
          setConnectError('Passkeys not supported in this browser');
        } else {
          setConnectError(err.message);
        }
      }
    }
  }, [connect]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  }, [disconnect]);

  // Loading state
  if (isConnecting) {
    return (
      <button disabled className="btn-loading">
        Connecting...
      </button>
    );
  }

  // Connected state
  if (isConnected && smartWalletPubkey) {
    const shortAddress = `${smartWalletPubkey.toBase58().slice(0, 4)}...${smartWalletPubkey.toBase58().slice(-4)}`;

    return (
      <div className="connected-wallet">
        <span className="wallet-address">{shortAddress}</span>
        <button onClick={handleDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  // Disconnected state
  return (
    <div>
      <button onClick={handleConnect}>
        Connect with Passkey
      </button>
      {connectError && (
        <p className="error">{connectError}</p>
      )}
    </div>
  );
}
```

## Step 6: Display Wallet Information

```typescript
// src/components/wallet/wallet-info.tsx
'use client';

import { useWallet } from '@lazorkit/wallet';

export function WalletInfo() {
  const { smartWalletPubkey, passkeyPubkey, isConnected } = useWallet();

  if (!isConnected || !smartWalletPubkey) {
    return null;
  }

  return (
    <div className="wallet-info">
      <h3>Wallet Connected</h3>

      <div className="info-row">
        <label>Smart Wallet (PDA):</label>
        <code>{smartWalletPubkey.toBase58()}</code>
      </div>

      {passkeyPubkey && (
        <div className="info-row">
          <label>Passkey Public Key:</label>
          <code>
            {Buffer.from(passkeyPubkey).toString('hex').slice(0, 16)}...
          </code>
        </div>
      )}

      <a
        href={`https://explorer.solana.com/address/${smartWalletPubkey.toBase58()}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Explorer
      </a>
    </div>
  );
}
```

## Understanding the useWallet Hook

The `useWallet` hook provides:

| Property | Type | Description |
|----------|------|-------------|
| `smartWalletPubkey` | `PublicKey \| null` | The PDA smart wallet address |
| `passkeyPubkey` | `number[] \| null` | The passkey's public key bytes |
| `isConnected` | `boolean` | Whether wallet is connected |
| `isConnecting` | `boolean` | Connection in progress |
| `isLoading` | `boolean` | General loading state |
| `isSigning` | `boolean` | Transaction signing in progress |
| `error` | `Error \| null` | Any error that occurred |
| `connect` | `() => Promise<Account>` | Initiate connection |
| `disconnect` | `() => Promise<void>` | Disconnect wallet |
| `signTransaction` | `(ix) => Promise<Transaction>` | Sign without sending |
| `signAndSendTransaction` | `(ix) => Promise<string>` | Sign and broadcast |

## Best Practices

### 1. Handle Browser Compatibility

```typescript
const isWebAuthnSupported = () => {
  return window.PublicKeyCredential !== undefined;
};

if (!isWebAuthnSupported()) {
  return <p>Please use a browser that supports passkeys</p>;
}
```

### 2. Provide Clear Loading States

Users should always know what's happening:
- "Connecting..." during initial connection
- "Waiting for passkey..." during biometric prompt
- "Creating wallet..." when PDA is being derived

### 3. Handle Errors Gracefully

Common errors to handle:
- User cancelled the passkey prompt
- Passkeys not supported
- Network errors
- Portal/paymaster unavailable

## Next Steps

Now that you can connect wallets, learn how to:
- [Send gasless transactions](./02-gasless-transactions.md)
- [Persist sessions across reloads](./03-session-persistence.md)

## Troubleshooting

### Passkey prompt doesn't appear
- Ensure you're using HTTPS (required for WebAuthn)
- Check browser compatibility
- Try a different browser/device

### "Not allowed" error
- User may have denied the passkey request
- Check if the domain is registered with the portal

### Connection succeeds but no wallet address
- The PDA derivation may have failed
- Check the console for detailed errors

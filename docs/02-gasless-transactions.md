# Tutorial 2: Gasless Transactions

Learn how to send SOL and SPL tokens without paying network fees using the LazorKit paymaster.

## What You'll Learn

- How the paymaster enables gasless transactions
- Sending SOL transfers
- Sending SPL token transfers (with PDA considerations)
- Handling transaction status and errors

## Prerequisites

- Completed [Tutorial 1: Passkey Wallet Creation](./01-passkey-wallet-creation.md)
- A connected LazorKit wallet
- Some Devnet SOL in your wallet (for transfers, not fees!)

## How Gasless Transactions Work

```
┌─────────────────────────────────────────────────────────────┐
│                     Transaction Flow                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User signs transaction with passkey                      │
│           │                                                  │
│           ▼                                                  │
│  2. Transaction sent to LazorKit Paymaster                   │
│           │                                                  │
│           ▼                                                  │
│  3. Paymaster adds fee payer signature                       │
│           │                                                  │
│           ▼                                                  │
│  4. Transaction broadcast to Solana network                  │
│           │                                                  │
│           ▼                                                  │
│  5. User pays $0 in gas! Paymaster covers fees.             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Sending SOL

```typescript
// src/components/transaction/sol-transfer-form.tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export function SolTransferForm() {
  const { smartWalletPubkey, signAndSendTransaction, isConnected } = useWallet();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    // Validate inputs
    if (!smartWalletPubkey) {
      setError('Wallet not connected');
      return;
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipient);
    } catch {
      setError('Invalid recipient address');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Invalid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxSignature(null);

    try {
      // Create transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipientPubkey,
        lamports: Math.floor(amountNum * LAMPORTS_PER_SOL),
      });

      // Sign and send via LazorKit (gasless!)
      const signature = await signAndSendTransaction(instruction);

      setTxSignature(signature);
      setRecipient('');
      setAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transfer-form">
      <h2>Send SOL</h2>

      <div className="form-group">
        <label>Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter Solana address..."
          disabled={!isConnected || isLoading}
        />
      </div>

      <div className="form-group">
        <label>Amount (SOL)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          step="0.001"
          min="0"
          disabled={!isConnected || isLoading}
        />
      </div>

      <button
        onClick={handleTransfer}
        disabled={!isConnected || isLoading || !recipient || !amount}
      >
        {isLoading ? 'Sending...' : 'Send SOL'}
      </button>

      {error && <p className="error">{error}</p>}

      {txSignature && (
        <div className="success">
          <p>Transaction sent!</p>
          <a
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}
```

## Step 2: Sending SPL Tokens (USDC)

When working with SPL tokens and PDA wallets, there's a critical consideration:

> **IMPORTANT**: LazorKit smart wallets are Program Derived Addresses (PDAs). When deriving Associated Token Accounts, you **must** set `allowOwnerOffCurve=true`.

```typescript
// src/components/transaction/token-transfer-form.tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { PublicKey, Connection } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';

// USDC on Devnet
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const USDC_DECIMALS = 6;

export function TokenTransferForm() {
  const { smartWalletPubkey, signAndSendTransaction, isConnected } = useWallet();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    if (!smartWalletPubkey) {
      setError('Wallet not connected');
      return;
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipient);
    } catch {
      setError('Invalid recipient address');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Invalid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxSignature(null);

    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);

      // Get sender's ATA
      // CRITICAL: allowOwnerOffCurve = true for PDAs!
      const senderATA = await getAssociatedTokenAddress(
        USDC_MINT,
        smartWalletPubkey,
        true // <-- This is essential for PDA wallets!
      );

      // Get recipient's ATA
      const recipientATA = await getAssociatedTokenAddress(
        USDC_MINT,
        recipientPubkey,
        false // Regular wallet, can be false
      );

      // Check if recipient ATA exists, create if needed
      const instructions = [];

      try {
        await getAccount(connection, recipientATA);
      } catch {
        // ATA doesn't exist, add create instruction
        instructions.push(
          createAssociatedTokenAccountInstruction(
            smartWalletPubkey, // payer (our PDA)
            recipientATA,      // ATA to create
            recipientPubkey,   // owner
            USDC_MINT          // mint
          )
        );
      }

      // Add transfer instruction
      const transferAmount = Math.floor(amountNum * Math.pow(10, USDC_DECIMALS));
      instructions.push(
        createTransferInstruction(
          senderATA,
          recipientATA,
          smartWalletPubkey,
          transferAmount
        )
      );

      // Sign and send (all instructions gaslessly)
      // Note: For multiple instructions, you may need to handle them differently
      const signature = await signAndSendTransaction(instructions[instructions.length - 1]);

      setTxSignature(signature);
      setRecipient('');
      setAmount('');
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="transfer-form">
      <h2>Send USDC</h2>

      <div className="form-group">
        <label>Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter Solana address..."
          disabled={!isConnected || isLoading}
        />
      </div>

      <div className="form-group">
        <label>Amount (USDC)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          disabled={!isConnected || isLoading}
        />
      </div>

      <button
        onClick={handleTransfer}
        disabled={!isConnected || isLoading || !recipient || !amount}
      >
        {isLoading ? 'Sending...' : 'Send USDC'}
      </button>

      {error && <p className="error">{error}</p>}

      {txSignature && (
        <div className="success">
          <p>USDC sent!</p>
          <a
            href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}
```

## Understanding the signAndSendTransaction Function

The `signAndSendTransaction` function:

1. Takes a Solana instruction (or array of instructions)
2. Creates a transaction with the instruction(s)
3. Prompts the user for passkey authentication
4. Signs the transaction with the passkey
5. Sends to the LazorKit paymaster
6. Paymaster adds its fee payer signature
7. Broadcasts to Solana network
8. Returns the transaction signature

```typescript
// Basic usage
const signature = await signAndSendTransaction(instruction);

// With error handling
try {
  const signature = await signAndSendTransaction(instruction);
  console.log('TX:', signature);
} catch (error) {
  if (error.message.includes('cancelled')) {
    // User cancelled passkey prompt
  } else if (error.message.includes('insufficient')) {
    // Insufficient balance
  } else {
    // Other error
  }
}
```

## Creating a Transaction Hook

For reusable transaction logic:

```typescript
// src/hooks/use-transaction.ts
'use client';

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { TransactionInstruction } from '@solana/web3.js';

export function useTransaction() {
  const { signAndSendTransaction, isSigning } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const execute = useCallback(
    async (instruction: TransactionInstruction) => {
      setIsLoading(true);
      setError(null);
      setSignature(null);

      try {
        const sig = await signAndSendTransaction(instruction);
        setSignature(sig);
        return sig;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Transaction failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [signAndSendTransaction]
  );

  const reset = useCallback(() => {
    setError(null);
    setSignature(null);
  }, []);

  return {
    execute,
    reset,
    isLoading: isLoading || isSigning,
    error,
    signature,
  };
}
```

## Best Practices

### 1. Validate Before Sending

Always validate inputs before creating transactions:
- Check recipient address is valid
- Ensure amount is positive and within balance
- Verify the wallet is connected

### 2. Handle Common Errors

```typescript
const errorMessages: Record<string, string> = {
  'User cancelled': 'You cancelled the transaction',
  'insufficient': 'Insufficient balance for this transfer',
  'blockhash': 'Network is busy, please try again',
};
```

### 3. Show Transaction Status

Users should see:
- Loading state during signing
- Success with explorer link
- Clear error messages

### 4. Use Appropriate Confirmations

```typescript
// For important transactions, wait for confirmation
import { Connection } from '@solana/web3.js';

const connection = new Connection(rpcUrl);
await connection.confirmTransaction(signature, 'confirmed');
```

## Next Steps

- [Persist sessions across reloads](./03-session-persistence.md)
- [Integrate token swaps](./04-token-swaps.md)

## Troubleshooting

### "Owner does not match" error
You forgot `allowOwnerOffCurve=true` when deriving the ATA for the PDA wallet.

### "Insufficient funds for transaction fee"
This shouldn't happen with LazorKit (paymaster covers fees), but ensure:
- The paymaster is reachable
- Your environment variables are correct

### Transaction stuck pending
- Check Solana network status
- Try refreshing and resending
- Verify the paymaster is operational

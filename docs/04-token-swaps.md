# Tutorial 4: Token Swaps with Jupiter

Learn how to integrate Jupiter aggregator for gasless token swaps using LazorKit.

## What You'll Learn

- Jupiter API basics
- Fetching swap quotes
- Building and executing swap transactions
- Handling price impact and slippage

## Prerequisites

- Completed previous tutorials
- Understanding of DEX/AMM concepts
- Familiarity with API requests

## How Jupiter Works

Jupiter is Solana's leading DEX aggregator. It:

1. Finds the best swap routes across all Solana DEXes
2. Optimizes for best price with minimal slippage
3. Handles complex multi-hop routes automatically
4. Supports wrapped/unwrapped SOL conversions

## Step 1: Create Jupiter API Utilities

```typescript
// src/lib/jupiter.ts
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
    };
    percent: number;
  }>;
}

export interface SwapResult {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

/**
 * Fetch a swap quote from Jupiter
 */
export async function getQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}): Promise<QuoteResponse> {
  const { inputMint, outputMint, amount, slippageBps = 50 } = params;

  const url = new URL(JUPITER_QUOTE_API);
  url.searchParams.set('inputMint', inputMint);
  url.searchParams.set('outputMint', outputMint);
  url.searchParams.set('amount', amount);
  url.searchParams.set('slippageBps', slippageBps.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch quote: ${await response.text()}`);
  }

  return response.json();
}

/**
 * Build a swap transaction from a quote
 */
export async function getSwapTransaction(params: {
  quoteResponse: QuoteResponse;
  userPublicKey: string;
  wrapUnwrapSOL?: boolean;
}): Promise<SwapResult> {
  const { quoteResponse, userPublicKey, wrapUnwrapSOL = true } = params;

  const response = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: wrapUnwrapSOL,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: 'auto',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to build swap: ${await response.text()}`);
  }

  return response.json();
}

/**
 * Common token addresses
 */
export const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC_DEVNET: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  USDC_MAINNET: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

/**
 * Parse amount to smallest unit
 */
export function parseAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (isNaN(value)) return '0';
  return Math.floor(value * Math.pow(10, decimals)).toString();
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string, decimals: number): string {
  const value = parseInt(amount) / Math.pow(10, decimals);
  return value.toLocaleString('en-US', {
    maximumFractionDigits: 6,
  });
}
```

## Step 2: Create the Swap Form Component

```typescript
// src/components/swap/swap-form.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import {
  getQuote,
  getSwapTransaction,
  TOKENS,
  parseAmount,
  formatAmount,
  type QuoteResponse,
} from '@/lib/jupiter';

interface Token {
  address: string;
  symbol: string;
  decimals: number;
}

const SWAP_TOKENS: Token[] = [
  { address: TOKENS.SOL, symbol: 'SOL', decimals: 9 },
  { address: TOKENS.USDC_DEVNET, symbol: 'USDC', decimals: 6 },
];

export function SwapForm() {
  const { smartWalletPubkey, isConnected, signAndSendTransaction } = useWallet();

  // Form state
  const [inputToken, setInputToken] = useState<Token>(SWAP_TOKENS[0]);
  const [outputToken, setOutputToken] = useState<Token>(SWAP_TOKENS[1]);
  const [inputAmount, setInputAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  // Loading states
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // Result
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch quote when input changes (debounced)
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingQuote(true);
      setError(null);

      try {
        const amount = parseAmount(inputAmount, inputToken.decimals);
        const quoteResult = await getQuote({
          inputMint: inputToken.address,
          outputMint: outputToken.address,
          amount,
          slippageBps: 50, // 0.5% slippage
        });
        setQuote(quoteResult);
      } catch (err) {
        console.error('Quote error:', err);
        setError('Failed to get quote');
        setQuote(null);
      } finally {
        setIsLoadingQuote(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inputAmount, inputToken, outputToken]);

  // Swap tokens (flip input/output)
  const handleSwapTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount('');
    setQuote(null);
  };

  // Execute swap
  const handleSwap = async () => {
    if (!smartWalletPubkey || !quote) return;

    setIsSwapping(true);
    setError(null);
    setTxSignature(null);

    try {
      // Get swap transaction from Jupiter
      const swapResult = await getSwapTransaction({
        quoteResponse: quote,
        userPublicKey: smartWalletPubkey.toBase58(),
      });

      // Deserialize transaction
      const swapTxBuffer = Buffer.from(swapResult.swapTransaction, 'base64');

      // Try VersionedTransaction first, fall back to legacy
      let tx: VersionedTransaction | Transaction;
      try {
        tx = VersionedTransaction.deserialize(swapTxBuffer);
      } catch {
        tx = Transaction.from(swapTxBuffer);
      }

      // For legacy transactions, extract and send instruction
      if (tx instanceof Transaction && tx.instructions.length > 0) {
        const signature = await signAndSendTransaction(tx.instructions[0]);
        setTxSignature(signature);
      } else {
        setError('Complex swap transactions require additional handling');
      }

      setInputAmount('');
      setQuote(null);
    } catch (err) {
      console.error('Swap error:', err);
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  // Calculate output amount
  const outputAmount = quote
    ? formatAmount(quote.outAmount, outputToken.decimals)
    : '';

  // Price impact severity
  const priceImpact = quote ? parseFloat(quote.priceImpactPct) : 0;
  const priceImpactSeverity =
    priceImpact < 1 ? 'low' : priceImpact < 5 ? 'medium' : 'high';

  return (
    <div className="swap-form">
      <h2>Swap Tokens</h2>

      {/* Input Token */}
      <div className="token-input">
        <label>You Pay</label>
        <div className="input-row">
          <select
            value={inputToken.address}
            onChange={(e) => {
              const token = SWAP_TOKENS.find((t) => t.address === e.target.value);
              if (token) setInputToken(token);
            }}
          >
            {SWAP_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="0.0"
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Swap Direction Button */}
      <button className="swap-direction" onClick={handleSwapTokens}>
        ↕
      </button>

      {/* Output Token */}
      <div className="token-input">
        <label>You Receive</label>
        <div className="input-row">
          <select
            value={outputToken.address}
            onChange={(e) => {
              const token = SWAP_TOKENS.find((t) => t.address === e.target.value);
              if (token) setOutputToken(token);
            }}
          >
            {SWAP_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
          <div className="output-amount">
            {isLoadingQuote ? 'Loading...' : outputAmount || '0.0'}
          </div>
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="quote-details">
          <div className="detail-row">
            <span>Rate:</span>
            <span>
              1 {inputToken.symbol} ={' '}
              {(
                parseInt(quote.outAmount) /
                Math.pow(10, outputToken.decimals) /
                (parseInt(quote.inAmount) / Math.pow(10, inputToken.decimals))
              ).toFixed(4)}{' '}
              {outputToken.symbol}
            </span>
          </div>
          <div className="detail-row">
            <span>Price Impact:</span>
            <span className={`impact-${priceImpactSeverity}`}>
              {priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="detail-row">
            <span>Route:</span>
            <span>
              {quote.routePlan.map((r) => r.swapInfo.label).join(' → ')}
            </span>
          </div>
        </div>
      )}

      {/* High Price Impact Warning */}
      {priceImpactSeverity === 'high' && (
        <div className="warning">
          High price impact! Consider reducing the amount.
        </div>
      )}

      {/* Swap Button */}
      <button
        className="swap-button"
        onClick={handleSwap}
        disabled={!isConnected || !quote || isSwapping}
      >
        {isSwapping
          ? 'Swapping...'
          : !isConnected
          ? 'Connect Wallet'
          : !quote
          ? 'Enter Amount'
          : `Swap ${inputToken.symbol} for ${outputToken.symbol}`}
      </button>

      {/* Error */}
      {error && <div className="error">{error}</div>}

      {/* Success */}
      {txSignature && (
        <div className="success">
          Swap successful!{' '}
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

## Step 3: Understanding Jupiter Quotes

A Jupiter quote contains:

```typescript
{
  inputMint: "So11111111111...",    // Token you're selling
  inAmount: "1000000000",            // Amount in (lamports/smallest unit)
  outputMint: "EPjFWdd5Aufq...",    // Token you're buying
  outAmount: "95420000",             // Amount out (after all fees)
  priceImpactPct: "0.12",           // Price impact percentage
  slippageBps: 50,                   // Slippage tolerance (50 = 0.5%)
  routePlan: [                       // How the swap will execute
    {
      swapInfo: {
        ammKey: "...",               // DEX pool address
        label: "Raydium",            // DEX name
        inputMint: "So11...",
        outputMint: "EPjF...",
        inAmount: "1000000000",
        outAmount: "95420000"
      },
      percent: 100                   // Percentage through this route
    }
  ]
}
```

## Handling Slippage

Slippage protects you from price changes during transaction processing:

```typescript
// Conservative (0.5%)
const slippageBps = 50;

// Moderate (1%)
const slippageBps = 100;

// Aggressive (3%)
const slippageBps = 300;

// Let user choose
const [slippage, setSlippage] = useState(50);
```

## Multi-Hop Routes

Jupiter automatically finds multi-hop routes for better prices:

```
SOL → USDC (direct)
SOL → RAY → USDC (2-hop, might be better price)
SOL → USDT → USDC (2-hop through different path)
```

The route plan shows exactly how your swap will execute:

```typescript
const routeDisplay = quote.routePlan
  .map((step) => step.swapInfo.label)
  .join(' → ');
// "Raydium → Orca"
```

## Devnet Considerations

- Devnet has limited liquidity
- Not all token pairs are available
- Use SOL ↔ USDC for testing (most liquid)
- Some routes may not work on Devnet

```typescript
// Check if quote is available
if (!quote || quote.outAmount === '0') {
  setError('No route available for this swap');
}
```

## Best Practices

### 1. Debounce Quote Requests

```typescript
useEffect(() => {
  const timer = setTimeout(fetchQuote, 500);
  return () => clearTimeout(timer);
}, [inputAmount]);
```

### 2. Show Price Impact Warnings

```typescript
const getPriceImpactColor = (impact: number) => {
  if (impact < 1) return 'green';
  if (impact < 5) return 'yellow';
  return 'red';
};
```

### 3. Handle Quote Expiry

```typescript
// Quotes are valid for ~30 seconds
// Refresh before executing
const [quoteTimestamp, setQuoteTimestamp] = useState(0);

useEffect(() => {
  if (Date.now() - quoteTimestamp > 25000) {
    // Quote is stale, refresh it
    fetchQuote();
  }
}, [quoteTimestamp]);
```

### 4. Validate Before Executing

```typescript
const canSwap =
  isConnected &&
  quote &&
  parseFloat(inputAmount) > 0 &&
  priceImpact < 10; // Block swaps with >10% impact
```

## Next Steps

- [Build subscription billing](./05-subscription-billing.md)

## Troubleshooting

### "No route found"
- Token pair may not have liquidity
- Try a smaller amount
- Check if tokens exist on the network (Devnet vs Mainnet)

### "Transaction too large"
- Complex routes may exceed transaction size limits
- Try a simpler route or smaller amount

### "Slippage exceeded"
- Price moved during transaction
- Increase slippage tolerance
- Try again quickly

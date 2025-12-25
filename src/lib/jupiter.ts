/**
 * Jupiter API Integration
 *
 * Provides utilities for fetching quotes and building swap transactions
 * using Jupiter's V6 API. All swaps are gasless via LazorKit paymaster.
 */

import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// Jupiter API endpoints
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const JUPITER_TOKENS_API = 'https://token.jup.ag/all';

// Common token mints on Devnet and Mainnet
export const POPULAR_TOKENS = {
  devnet: {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    USDT: 'EJwZgeZrdC8TXTQbQBoL6bfuAnFUUy1PVCMB4DYPzVaS',
  },
  mainnet: {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  },
} as const;

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null | { amount: string; feeBps: number };
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface SwapResult {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
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
    const error = await response.text();
    throw new Error(`Failed to fetch quote: ${error}`);
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
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number | 'auto';
}): Promise<SwapResult> {
  const {
    quoteResponse,
    userPublicKey,
    wrapUnwrapSOL = true,
    dynamicComputeUnitLimit = true,
    prioritizationFeeLamports = 'auto',
  } = params;

  const response = await fetch(JUPITER_SWAP_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: wrapUnwrapSOL,
      dynamicComputeUnitLimit,
      prioritizationFeeLamports,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to build swap transaction: ${error}`);
  }

  return response.json();
}

/**
 * Fetch list of supported tokens from Jupiter
 */
export async function getTokenList(): Promise<Token[]> {
  const response = await fetch(JUPITER_TOKENS_API);

  if (!response.ok) {
    throw new Error('Failed to fetch token list');
  }

  return response.json();
}

/**
 * Deserialize a swap transaction from base64
 */
export function deserializeSwapTransaction(
  swapTransaction: string
): VersionedTransaction | Transaction {
  const buffer = Buffer.from(swapTransaction, 'base64');

  // Try to deserialize as VersionedTransaction first
  try {
    return VersionedTransaction.deserialize(buffer);
  } catch {
    // Fall back to legacy Transaction
    return Transaction.from(buffer);
  }
}

/**
 * Calculate price impact severity
 */
export function getPriceImpactSeverity(
  priceImpactPct: string
): 'low' | 'medium' | 'high' {
  const impact = parseFloat(priceImpactPct);

  if (impact < 1) return 'low';
  if (impact < 5) return 'medium';
  return 'high';
}

/**
 * Format amount for display with proper decimals
 */
export function formatTokenAmount(
  amount: string,
  decimals: number,
  maxDecimals: number = 6
): string {
  const value = parseInt(amount) / Math.pow(10, decimals);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Parse user input amount to lamports/smallest unit
 */
export function parseTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (isNaN(value)) return '0';
  return Math.floor(value * Math.pow(10, decimals)).toString();
}

/**
 * Get a default list of common tokens for the swap UI
 */
export function getDefaultTokens(network: 'devnet' | 'mainnet' = 'devnet'): Token[] {
  const mints = POPULAR_TOKENS[network];

  return [
    {
      address: mints.SOL,
      symbol: 'SOL',
      name: 'Solana',
      decimals: 9,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    },
    {
      address: mints.USDC,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    },
  ];
}

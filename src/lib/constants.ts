/**
 * Application Constants
 *
 * Centralized location for all constants used across the application.
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Token mint addresses for Devnet
 */
export const TOKENS = {
  /** USDC on Devnet (Circle's test token) */
  USDC_DEVNET: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),

  /** Wrapped SOL */
  WSOL: new PublicKey('So11111111111111111111111111111111111111112'),
} as const;

/**
 * Token metadata
 */
export const TOKEN_INFO = {
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  'So11111111111111111111111111111111111111112': {
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
} as const;

/**
 * LazorKit Program IDs
 */
export const LAZORKIT = {
  /** Main smart wallet program */
  PROGRAM_ID: new PublicKey('J6Big9w1VNeRZgDWH5qmNz2Nd6XFq5QeZbqC8caqSE5W'),

  /** Default policy program */
  POLICY_PROGRAM_ID: new PublicKey('CNT2aEgxucQjmt5SRsA6hSGrt241Bvc9zsgPvSuMjQTE'),
} as const;

/**
 * External links
 */
export const LINKS = {
  /** Solana Devnet faucet */
  FAUCET: 'https://faucet.solana.com/',

  /** Solana Explorer */
  EXPLORER: 'https://explorer.solana.com',

  /** LazorKit documentation */
  DOCS: 'https://docs.lazorkit.xyz/',

  /** LazorKit GitHub */
  GITHUB: 'https://github.com/lazor-kit',
} as const;

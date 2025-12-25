/**
 * Environment configuration with type-safe access
 *
 * This module provides type-safe access to environment variables
 * with sensible defaults for development.
 */

/**
 * Get an environment variable with optional default value
 */
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Application environment configuration
 */
export const env = {
  /**
   * Solana RPC URL for network connections
   * Default: Devnet public RPC
   */
  RPC_URL: getEnvVar(
    'NEXT_PUBLIC_RPC_URL',
    'https://api.devnet.solana.com'
  ),

  /**
   * LazorKit Portal URL for passkey authentication UI
   * This is where the passkey creation/assertion popup is hosted
   */
  PORTAL_URL: getEnvVar(
    'NEXT_PUBLIC_PORTAL_URL',
    'https://portal.lazor.sh'
  ),

  /**
   * LazorKit Paymaster URL for gasless transaction sponsorship
   * The paymaster pays network fees on behalf of users
   */
  PAYMASTER_URL: getEnvVar(
    'NEXT_PUBLIC_PAYMASTER_URL',
    'https://lazorkit-paymaster.onrender.com'
  ),

  /**
   * Current network cluster
   */
  CLUSTER: 'devnet' as const,
} as const;

/**
 * Type for the environment configuration
 */
export type Env = typeof env;

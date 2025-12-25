'use client';

/**
 * Header Component
 *
 * Application header with branding and wallet connection.
 */

import Link from 'next/link';
import { ConnectButton } from '@/components/wallet/connect-button';
import { Fingerprint } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Fingerprint className="h-6 w-6 text-primary" />
          <span>LazorKit Starter</span>
        </Link>

        {/* Navigation - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/demo"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Demo
          </Link>
          <Link
            href="/demo/wallet"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Wallet
          </Link>
          <Link
            href="/demo/transfer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Transfer
          </Link>
          <Link
            href="/demo/swap"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Swap
          </Link>
        </nav>

        {/* Wallet Connection */}
        <ConnectButton />
      </div>
    </header>
  );
}

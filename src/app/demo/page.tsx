'use client';

/**
 * Demo Dashboard
 *
 * Overview of all demo features with quick access cards.
 */

import Link from 'next/link';
import { useWallet } from '@lazorkit/wallet';
import { useBalance } from '@/hooks/use-balance';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceStatus } from '@/components/status/service-status';
import {
  Wallet,
  Send,
  ArrowRightLeft,
  RefreshCw,
  Repeat,
  CreditCard,
  ArrowRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const demoFeatures = [
  {
    title: 'Wallet Connection',
    description: 'Connect with FaceID, TouchID, or Windows Hello',
    href: '/demo/wallet',
    icon: Wallet,
  },
  {
    title: 'SOL Transfer',
    description: 'Send SOL with zero gas fees',
    href: '/demo/transfer',
    icon: Send,
  },
  {
    title: 'Token Transfer',
    description: 'Send USDC tokens gaslessly',
    href: '/demo/token',
    icon: ArrowRightLeft,
  },
  {
    title: 'Session Persistence',
    description: 'Stay logged in across page reloads',
    href: '/demo/session',
    icon: RefreshCw,
  },
  {
    title: 'Token Swap',
    description: 'Swap tokens via Jupiter',
    href: '/demo/swap',
    icon: Repeat,
  },
  {
    title: 'Subscription',
    description: 'Recurring USDC payments',
    href: '/demo/subscription',
    icon: CreditCard,
  },
];

export default function DemoDashboard() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const { balance } = useBalance();

  return (
    <div className="space-y-8">
      {/* Service Status Alert */}
      <ServiceStatus />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Demo Dashboard</h1>
        <p className="text-muted-foreground">
          Explore LazorKit SDK features with interactive examples
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Wallet Connected</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {smartWalletPubkey?.toBase58().slice(0, 8)}...
                      {smartWalletPubkey?.toBase58().slice(-8)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Not Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Connect to access all features
                    </p>
                  </div>
                </>
              )}
            </div>
            {isConnected && balance !== null && (
              <Badge variant="outline" className="text-lg px-4 py-2">
                {balance.toFixed(4)} SOL
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoFeatures.map((feature) => (
          <Card key={feature.href} className="hover:border-primary transition-colors">
            <CardHeader>
              <feature.icon className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="w-full justify-between">
                <Link href={feature.href}>
                  Explore
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started */}
      {!isConnected && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Click the &quot;Connect with Passkey&quot; button in the top right to begin.
              Your browser will prompt you for biometric authentication.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

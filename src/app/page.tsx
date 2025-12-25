/**
 * Landing Page
 *
 * The main entry point showcasing LazorKit's passkey wallet capabilities.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Fingerprint,
  Zap,
  Shield,
  Smartphone,
  ArrowRight,
  Github,
  ExternalLink,
} from 'lucide-react';

const features = [
  {
    icon: Fingerprint,
    title: 'Passkey Authentication',
    description:
      'Sign in with FaceID, TouchID, or Windows Hello. No seed phrases, no browser extensions.',
  },
  {
    icon: Zap,
    title: 'Gasless Transactions',
    description:
      'Users never pay network fees. The paymaster sponsors all transactions automatically.',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    description:
      'Private keys never leave your device. Hardware-backed security via Secure Enclave.',
  },
  {
    icon: Smartphone,
    title: 'Cross-Device',
    description:
      'Passkeys sync across your devices. Lose your phone? Recover with another device.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Live on Solana Devnet
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The Future of Solana Wallets is{' '}
              <span className="text-primary">Passkeys</span>
            </h1>

            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Build gasless Solana dApps with biometric authentication. No seed
              phrases, no browser extensions, no friction. Just scan your face
              and transact.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/demo">
                  Try the Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <a
                  href="https://github.com/lazor-kit"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Why Passkeys + Smart Wallets?
            </h2>
            <p className="text-muted-foreground">
              The convergence of WebAuthn standards and Solana&apos;s secp256r1
              precompile creates the best possible user experience.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-background">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                See It in Action
              </h2>
              <p className="text-muted-foreground mb-6">
                This starter template demonstrates all the core LazorKit SDK
                features. Clone it, customize it, and ship your own passkey-powered
                Solana dApp.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Passkey wallet creation and login',
                  'Gasless SOL and USDC transfers',
                  'Session persistence across tabs',
                  'Token swaps via Jupiter',
                  'Subscription billing demo',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild>
                <Link href="/demo">
                  Explore Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="bg-muted rounded-lg p-6 lg:p-8">
              <pre className="text-sm overflow-x-auto">
                <code>{`// Connect with passkey
const { connect } = useWallet();
await connect();

// Send gasless transaction
const ix = SystemProgram.transfer({
  fromPubkey: smartWalletPubkey,
  toPubkey: recipient,
  lamports: amount,
});

// Paymaster covers fees!
await signAndSendTransaction(ix);`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              <span className="font-semibold">LazorKit Starter</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a
                href="https://lazorkit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1"
              >
                LazorKit
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://github.com/lazor-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1"
              >
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1"
              >
                Solana
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

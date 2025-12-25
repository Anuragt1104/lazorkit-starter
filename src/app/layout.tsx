import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/app-providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LazorKit Starter - Passkey Wallet for Solana',
  description:
    'A production-ready starter template demonstrating passkey authentication and gasless transactions on Solana using the LazorKit SDK.',
  keywords: [
    'Solana',
    'Passkey',
    'WebAuthn',
    'Smart Wallet',
    'Gasless',
    'LazorKit',
    'Web3',
  ],
  authors: [{ name: 'LazorKit Community' }],
  openGraph: {
    title: 'LazorKit Starter - Passkey Wallet for Solana',
    description:
      'Build gasless Solana dApps with passkey authentication. No seed phrases, no browser extensions.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

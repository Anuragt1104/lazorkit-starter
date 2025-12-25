# LazorKit Starter

A comprehensive starter template demonstrating passkey authentication and gasless transactions on Solana using the [LazorKit SDK](https://lazorkit.com/).

![LazorKit Starter](https://img.shields.io/badge/Solana-Devnet-green) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **Passkey Wallet Connection** - Connect using FaceID, TouchID, or Windows Hello
- **Gasless SOL Transfers** - Send SOL without paying network fees
- **SPL Token Transfers** - Transfer USDC and other tokens gaslessly
- **Session Persistence** - Stay logged in across page reloads
- **Token Swaps** - Swap tokens via Jupiter aggregator
- **Subscription Billing** - Recurring USDC payments demo

## Quick Start

### Prerequisites

- Node.js 18+ (20+ recommended)
- pnpm, npm, or yarn
- A browser that supports WebAuthn (Chrome, Safari, Edge, Firefox)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lazorkit-starter.git
cd lazorkit-starter

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Setup

Create a `.env.local` file with the following variables:

```env
# Solana RPC URL (Devnet)
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com

# LazorKit Portal URL
NEXT_PUBLIC_PORTAL_URL=https://portal.lazor.sh

# LazorKit Paymaster URL (covers gas fees)
NEXT_PUBLIC_PAYMASTER_URL=https://lazorkit-paymaster.onrender.com
```

## Project Structure

```
lazorkit-starter/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   └── demo/               # Demo pages
│   │       ├── wallet/         # Wallet connection demo
│   │       ├── transfer/       # SOL transfer demo
│   │       ├── token/          # Token transfer demo
│   │       ├── session/        # Session persistence demo
│   │       ├── swap/           # Token swap demo
│   │       └── subscription/   # Subscription billing demo
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── wallet/             # Wallet-related components
│   │   ├── transaction/        # Transaction forms
│   │   ├── swap/               # Token swap components
│   │   ├── subscription/       # Subscription components
│   │   └── layout/             # Header, sidebar, footer
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-balance.ts      # Fetch SOL/token balance
│   │   ├── use-session.ts      # Session persistence
│   │   └── use-subscription.ts # Subscription state
│   │
│   ├── lib/                    # Utility libraries
│   │   ├── constants.ts        # Token mints, program IDs
│   │   ├── utils.ts            # Format helpers
│   │   ├── jupiter.ts          # Jupiter API integration
│   │   └── subscription.ts     # Subscription logic
│   │
│   ├── providers/              # React context providers
│   │   └── lazorkit-provider.tsx
│   │
│   └── config/                 # Configuration
│       └── env.ts              # Type-safe env access
│
├── docs/                       # Step-by-step tutorials
│   ├── 01-passkey-wallet-creation.md
│   ├── 02-gasless-transactions.md
│   ├── 03-session-persistence.md
│   ├── 04-token-swaps.md
│   └── 05-subscription-billing.md
│
└── public/                     # Static assets
```

## How It Works

### Passkey Authentication

LazorKit uses WebAuthn to create a cryptographic keypair stored in your device's Secure Enclave. The private key never leaves your device. A smart wallet (PDA) is created on Solana that recognizes your passkey signature.

```typescript
import { useWallet } from '@lazorkit/wallet';

function ConnectButton() {
  const { connect, isConnected, smartWalletPubkey } = useWallet();

  return (
    <button onClick={connect}>
      {isConnected ? smartWalletPubkey?.toBase58() : 'Connect with Passkey'}
    </button>
  );
}
```

### Gasless Transactions

The LazorKit paymaster covers all network fees. When you sign a transaction, it's sent to the paymaster which adds its signature as fee payer and broadcasts to the network.

```typescript
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useWallet } from '@lazorkit/wallet';

function TransferButton() {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();

  const handleTransfer = async () => {
    const instruction = SystemProgram.transfer({
      fromPubkey: smartWalletPubkey!,
      toPubkey: recipientPubkey,
      lamports: 0.1 * LAMPORTS_PER_SOL,
    });

    // Paymaster covers fees automatically!
    const signature = await signAndSendTransaction(instruction);
  };

  return <button onClick={handleTransfer}>Send 0.1 SOL</button>;
}
```

### SPL Token Transfers (Important!)

When working with SPL tokens and PDA wallets, you **must** set `allowOwnerOffCurve=true` when deriving Associated Token Accounts:

```typescript
import { getAssociatedTokenAddress } from '@solana/spl-token';

// CRITICAL: allowOwnerOffCurve = true for PDAs!
const senderATA = await getAssociatedTokenAddress(
  usdcMint,
  smartWalletPubkey,
  true  // allowOwnerOffCurve
);
```

## Tutorials

1. [Passkey Wallet Creation](./docs/01-passkey-wallet-creation.md) - Set up passkey authentication
2. [Gasless Transactions](./docs/02-gasless-transactions.md) - Send SOL and tokens without fees
3. [Session Persistence](./docs/03-session-persistence.md) - Keep users logged in
4. [Token Swaps](./docs/04-token-swaps.md) - Integrate Jupiter for token swaps
5. [Subscription Billing](./docs/05-subscription-billing.md) - Recurring payments demo

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@lazorkit/wallet` | ^1.3.5 | LazorKit SDK for passkey wallets |
| `@coral-xyz/anchor` | ^0.31.1 | Anchor framework for Solana |
| `@solana/web3.js` | ^1.98.0 | Solana JavaScript SDK |
| `@solana/spl-token` | ^0.4.13 | SPL Token interactions |
| `next` | 15.3.3 | React framework |
| `tailwindcss` | ^4 | Utility-first CSS |

## Testing on Devnet

1. Connect your wallet using the passkey flow
2. Get Devnet SOL from the [Solana Faucet](https://faucet.solana.com/)
3. Get Devnet USDC from the [Circle Faucet](https://faucet.circle.com/)
4. Try the different demo features

## Browser Compatibility

Passkeys require WebAuthn support:

| Browser | Support |
|---------|---------|
| Chrome 67+ | Full support |
| Safari 14+ | Full support |
| Edge 79+ | Full support |
| Firefox 60+ | Full support |

Mobile devices with biometric sensors (Face ID, Touch ID, fingerprint) work best.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## Resources

- [LazorKit Documentation](https://docs.lazorkit.com/)
- [LazorKit GitHub](https://github.com/lazor-kit)
- [Solana Cookbook](https://solanacookbook.com/)
- [Jupiter API Docs](https://station.jup.ag/docs/)

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with the [LazorKit SDK](https://lazorkit.com/) for the Solana ecosystem.

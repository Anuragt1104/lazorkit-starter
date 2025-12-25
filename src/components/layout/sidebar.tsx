'use client';

/**
 * Sidebar Component
 *
 * Navigation sidebar for the demo section.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Wallet,
  Send,
  ArrowRightLeft,
  RefreshCw,
  Repeat,
  CreditCard,
  LayoutDashboard,
} from 'lucide-react';

const navItems = [
  {
    title: 'Dashboard',
    href: '/demo',
    icon: LayoutDashboard,
  },
  {
    title: 'Wallet',
    href: '/demo/wallet',
    icon: Wallet,
  },
  {
    title: 'SOL Transfer',
    href: '/demo/transfer',
    icon: Send,
  },
  {
    title: 'Token Transfer',
    href: '/demo/token',
    icon: ArrowRightLeft,
  },
  {
    title: 'Session',
    href: '/demo/session',
    icon: RefreshCw,
  },
  {
    title: 'Token Swap',
    href: '/demo/swap',
    icon: Repeat,
  },
  {
    title: 'Subscription',
    href: '/demo/subscription',
    icon: CreditCard,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-muted/30">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Demo Features</h2>
        <p className="text-sm text-muted-foreground">
          Explore LazorKit SDK capabilities
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground">
          Built with LazorKit SDK v1.3.5
        </p>
      </div>
    </aside>
  );
}

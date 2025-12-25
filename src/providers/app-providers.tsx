'use client';

/**
 * Combined Application Providers
 *
 * This component wraps the application with all necessary providers
 * in the correct nesting order. Add new providers here to maintain
 * a clean root layout.
 */

import { ReactNode } from 'react';
import { LazorKitWrapper } from './lazorkit-provider';
import { Toaster } from '@/components/ui/sonner';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LazorKitWrapper>
      {children}
      {/* Toast notifications for transaction feedback */}
      <Toaster position="bottom-right" richColors />
    </LazorKitWrapper>
  );
}

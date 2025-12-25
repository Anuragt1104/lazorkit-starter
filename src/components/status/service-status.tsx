'use client';

/**
 * Service Status Component
 *
 * Checks and displays the health status of LazorKit services.
 * This helps users understand if connection issues are due to
 * service availability rather than their own setup.
 */

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { env } from '@/config/env';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceHealth {
  portal: 'checking' | 'online' | 'offline';
  paymaster: 'checking' | 'online' | 'offline';
  rpc: 'checking' | 'online' | 'offline';
}

export function ServiceStatus() {
  const [health, setHealth] = useState<ServiceHealth>({
    portal: 'checking',
    paymaster: 'checking',
    rpc: 'checking',
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkServices = async () => {
    setIsChecking(true);
    setHealth({
      portal: 'checking',
      paymaster: 'checking',
      rpc: 'checking',
    });

    // Check Portal
    try {
      const portalRes = await fetch(env.PORTAL_URL, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      // no-cors doesn't give us status, but if it doesn't throw, it's reachable
      setHealth(prev => ({ ...prev, portal: 'online' }));
    } catch {
      setHealth(prev => ({ ...prev, portal: 'offline' }));
    }

    // Check Paymaster
    try {
      const paymasterRes = await fetch(env.PAYMASTER_URL, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      setHealth(prev => ({ ...prev, paymaster: 'online' }));
    } catch {
      setHealth(prev => ({ ...prev, paymaster: 'offline' }));
    }

    // Check RPC
    try {
      const rpcRes = await fetch(env.RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
        }),
      });
      const data = await rpcRes.json();
      setHealth(prev => ({
        ...prev,
        rpc: data.result === 'ok' ? 'online' : 'offline'
      }));
    } catch {
      setHealth(prev => ({ ...prev, rpc: 'offline' }));
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkServices();
  }, []);

  const allOnline = health.portal === 'online' &&
                    health.paymaster === 'online' &&
                    health.rpc === 'online';

  const hasOffline = health.portal === 'offline' ||
                     health.paymaster === 'offline' ||
                     health.rpc === 'offline';

  const StatusBadge = ({ status }: { status: 'checking' | 'online' | 'offline' }) => {
    if (status === 'checking') {
      return (
        <Badge variant="secondary" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking
        </Badge>
      );
    }
    if (status === 'online') {
      return (
        <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3" />
          Online
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        Offline
      </Badge>
    );
  };

  if (allOnline) {
    return null; // Don't show anything when everything is working
  }

  return (
    <Alert variant={hasOffline ? 'destructive' : 'default'} className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>LazorKit Service Status</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkServices}
          disabled={isChecking}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Portal:</span>
            <StatusBadge status={health.portal} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Paymaster:</span>
            <StatusBadge status={health.paymaster} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">RPC:</span>
            <StatusBadge status={health.rpc} />
          </div>
        </div>
        {health.paymaster === 'offline' && (
          <p className="mt-2 text-sm">
            The paymaster service is currently unavailable. Passkey wallet connection
            will not work until the service is restored. This is an external service issue.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}

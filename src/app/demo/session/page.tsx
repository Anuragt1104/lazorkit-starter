'use client';

/**
 * Session Persistence Demo Page
 *
 * Demonstrates how to persist wallet sessions across page reloads.
 */

import { useSession } from '@/hooks/use-session';
import { useWallet } from '@lazorkit/wallet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Trash2, Info, Clock, Check, X } from 'lucide-react';

export default function SessionDemoPage() {
  const { isConnected } = useWallet();
  const { isRestoring, sessionInfo, clearSession, isSessionValid } = useSession();

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  const getSessionAge = (ts: number) => {
    const age = Date.now() - ts;
    const hours = Math.floor(age / (1000 * 60 * 60));
    const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Session Persistence</h1>
        <p className="text-muted-foreground">
          Stay logged in across page reloads and browser sessions
        </p>
      </div>

      {/* How It Works */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How Session Persistence Works</AlertTitle>
        <AlertDescription>
          When you connect your wallet, the session is saved to localStorage.
          On page reload, the app attempts to restore your session automatically
          using your passkey. Sessions expire after 24 hours for security.
        </AlertDescription>
      </Alert>

      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Status
          </CardTitle>
          <CardDescription>
            Current session information and controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Indicators */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              {isRestoring ? (
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              ) : isConnected ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Connection</p>
                <p className="text-xs text-muted-foreground">
                  {isRestoring
                    ? 'Restoring...'
                    : isConnected
                    ? 'Connected'
                    : 'Disconnected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              {sessionInfo ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Session Data</p>
                <p className="text-xs text-muted-foreground">
                  {sessionInfo ? 'Stored' : 'Not found'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              {isSessionValid ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Session Valid</p>
                <p className="text-xs text-muted-foreground">
                  {isSessionValid ? 'Yes' : 'No / Expired'}
                </p>
              </div>
            </div>
          </div>

          {/* Session Details */}
          {sessionInfo && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium">Session Details</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatTimestamp(sessionInfo.timestamp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span>{getSessionAge(sessionInfo.timestamp)}</span>
                </div>
                {sessionInfo.walletAddress && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wallet:</span>
                    <span className="font-mono text-xs">
                      {sessionInfo.walletAddress.slice(0, 8)}...
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Expires:</span>
                  <Badge variant={isSessionValid ? 'default' : 'destructive'}>
                    {isSessionValid ? 'Active' : 'Expired'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button
              variant="destructive"
              onClick={clearSession}
              disabled={!sessionInfo}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Try It */}
      <Card>
        <CardHeader>
          <CardTitle>Try It Out</CardTitle>
          <CardDescription>
            Test session persistence by following these steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Connect your wallet using the button in the header</li>
            <li>Observe that a session is created (see status above)</li>
            <li>Click &quot;Reload Page&quot; to refresh the browser</li>
            <li>Your wallet should automatically reconnect!</li>
            <li>Try &quot;Clear Session&quot; and reload to see it requires a new login</li>
          </ol>
        </CardContent>
      </Card>

      {/* Code Example */}
      <Card>
        <CardHeader>
          <CardTitle>Code Example</CardTitle>
          <CardDescription>
            How to implement session persistence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { useSession } from '@/hooks/use-session';

function App() {
  const { isRestoring, sessionInfo, clearSession } = useSession();

  if (isRestoring) {
    return <div>Restoring session...</div>;
  }

  return (
    <div>
      <p>Session valid: {sessionInfo?.connected ? 'Yes' : 'No'}</p>
      <button onClick={clearSession}>Logout</button>
    </div>
  );
}`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

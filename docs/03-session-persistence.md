# Tutorial 3: Session Persistence

Learn how to keep users logged in across page reloads and browser sessions using LazorKit's passkey authentication.

## What You'll Learn

- Implementing session storage
- Auto-restoring sessions on page load
- Session expiration and security
- Managing session state in React

## Prerequisites

- Completed [Tutorial 1: Passkey Wallet Creation](./01-passkey-wallet-creation.md)
- Basic understanding of localStorage

## How Session Persistence Works

```
┌─────────────────────────────────────────────────────────────┐
│                   Session Persistence Flow                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Initial Connection:                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐       │
│  │  User    │───>│  Passkey │───>│  Save to         │       │
│  │  Clicks  │    │  Auth    │    │  localStorage    │       │
│  │  Connect │    │          │    │                  │       │
│  └──────────┘    └──────────┘    └──────────────────┘       │
│                                                              │
│  Page Reload:                                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐       │
│  │  Check   │───>│  Valid?  │───>│  Auto-connect    │       │
│  │  Storage │    │  Fresh?  │    │  with Passkey    │       │
│  └──────────┘    └──────────┘    └──────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Create the Session Hook

```typescript
// src/hooks/use-session.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';

const SESSION_KEY = 'lazorkit-session';
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface SessionInfo {
  connected: boolean;
  timestamp: number;
  walletAddress?: string;
  expiresAt: number;
}

export interface UseSessionReturn {
  isRestoring: boolean;
  sessionInfo: SessionInfo | null;
  isSessionValid: boolean;
  clearSession: () => void;
  saveSession: () => void;
}

export function useSession(): UseSessionReturn {
  const { isConnected, connect, smartWalletPubkey } = useWallet();
  const [isRestoring, setIsRestoring] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  // Load session from localStorage
  const loadSession = useCallback((): SessionInfo | null => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;

      const session: SessionInfo = JSON.parse(stored);
      return session;
    } catch {
      return null;
    }
  }, []);

  // Save session to localStorage
  const saveSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!smartWalletPubkey) return;

    const session: SessionInfo = {
      connected: true,
      timestamp: Date.now(),
      walletAddress: smartWalletPubkey.toBase58(),
      expiresAt: Date.now() + DEFAULT_EXPIRY_MS,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setSessionInfo(session);
  }, [smartWalletPubkey]);

  // Clear session from localStorage
  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(SESSION_KEY);
    setSessionInfo(null);
  }, []);

  // Check if session is still valid
  const isSessionValid = useCallback((session: SessionInfo | null): boolean => {
    if (!session) return false;
    if (!session.connected) return false;
    if (Date.now() > session.expiresAt) return false;
    return true;
  }, []);

  // Attempt to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const session = loadSession();
      setSessionInfo(session);

      if (isSessionValid(session) && !isConnected) {
        try {
          // Auto-connect using passkey
          await connect();
        } catch (error) {
          // User may have cancelled passkey prompt
          // Clear invalid session
          console.warn('Session restore failed:', error);
          clearSession();
        }
      }

      setIsRestoring(false);
    };

    restoreSession();
  }, []); // Run once on mount

  // Save session when connection state changes
  useEffect(() => {
    if (isConnected && smartWalletPubkey) {
      saveSession();
    }
  }, [isConnected, smartWalletPubkey, saveSession]);

  return {
    isRestoring,
    sessionInfo,
    isSessionValid: isSessionValid(sessionInfo),
    clearSession,
    saveSession,
  };
}
```

## Step 2: Use the Session Hook in Your App

```typescript
// src/app/page.tsx
'use client';

import { useSession } from '@/hooks/use-session';
import { useWallet } from '@lazorkit/wallet';
import { ConnectButton } from '@/components/wallet/connect-button';

export default function Home() {
  const { isConnected, smartWalletPubkey } = useWallet();
  const { isRestoring, sessionInfo, isSessionValid } = useSession();

  // Show loading while restoring session
  if (isRestoring) {
    return (
      <div className="loading">
        <p>Restoring session...</p>
        <p className="hint">You may be prompted for passkey authentication</p>
      </div>
    );
  }

  return (
    <div>
      <ConnectButton />

      {isConnected && (
        <div className="wallet-info">
          <p>Wallet: {smartWalletPubkey?.toBase58()}</p>
          <p>Session valid: {isSessionValid ? 'Yes' : 'No'}</p>
          {sessionInfo && (
            <p>Connected since: {new Date(sessionInfo.timestamp).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## Step 3: Create a Session Status Component

```typescript
// src/components/session/session-status.tsx
'use client';

import { useSession } from '@/hooks/use-session';

export function SessionStatus() {
  const { sessionInfo, isSessionValid, clearSession } = useSession();

  if (!sessionInfo) {
    return (
      <div className="session-status not-stored">
        No session stored
      </div>
    );
  }

  const getSessionAge = (timestamp: number) => {
    const age = Date.now() - timestamp;
    const hours = Math.floor(age / (1000 * 60 * 60));
    const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m ago`;
  };

  const getTimeUntilExpiry = (expiresAt: number) => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className={`session-status ${isSessionValid ? 'valid' : 'expired'}`}>
      <h3>Session Information</h3>

      <div className="info-row">
        <span>Status:</span>
        <span>{isSessionValid ? 'Active' : 'Expired'}</span>
      </div>

      <div className="info-row">
        <span>Created:</span>
        <span>{getSessionAge(sessionInfo.timestamp)}</span>
      </div>

      <div className="info-row">
        <span>Expires in:</span>
        <span>{getTimeUntilExpiry(sessionInfo.expiresAt)}</span>
      </div>

      {sessionInfo.walletAddress && (
        <div className="info-row">
          <span>Wallet:</span>
          <code>{sessionInfo.walletAddress.slice(0, 8)}...</code>
        </div>
      )}

      <button onClick={clearSession} className="clear-session">
        Clear Session (Logout)
      </button>
    </div>
  );
}
```

## Security Considerations

### 1. Session Expiration

Always set a reasonable expiration time:

```typescript
// Shorter for high-security apps
const SHORT_EXPIRY = 1 * 60 * 60 * 1000; // 1 hour

// Longer for convenience
const LONG_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
```

### 2. Clear Session on Logout

```typescript
const handleLogout = async () => {
  clearSession(); // Clear localStorage
  await disconnect(); // Disconnect wallet
};
```

### 3. Validate on Every Restore

```typescript
// Don't trust stored data blindly
if (isSessionValid(session) && !isConnected) {
  try {
    await connect(); // This will re-verify with passkey
  } catch {
    clearSession(); // Invalid - clear it
  }
}
```

### 4. Handle Multiple Tabs

```typescript
// Listen for storage changes from other tabs
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === SESSION_KEY) {
      if (!e.newValue) {
        // Session cleared in another tab
        disconnect();
      } else {
        // Session updated in another tab
        setSessionInfo(JSON.parse(e.newValue));
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [disconnect]);
```

## Advanced: Custom Expiration Strategies

### Activity-Based Expiration

```typescript
// Extend session on user activity
const extendSession = () => {
  if (sessionInfo && isSessionValid) {
    const newSession = {
      ...sessionInfo,
      expiresAt: Date.now() + DEFAULT_EXPIRY_MS,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSessionInfo(newSession);
  }
};

// Call on user interactions
useEffect(() => {
  const events = ['click', 'keydown', 'scroll'];
  const throttledExtend = throttle(extendSession, 60000); // Max once per minute

  events.forEach(event =>
    document.addEventListener(event, throttledExtend)
  );

  return () => {
    events.forEach(event =>
      document.removeEventListener(event, throttledExtend)
    );
  };
}, [sessionInfo, isSessionValid]);
```

### Sliding Window Expiration

```typescript
const SLIDING_WINDOW = 15 * 60 * 1000; // 15 minutes

const checkAndExtendSession = () => {
  const session = loadSession();
  if (!session) return;

  const timeUntilExpiry = session.expiresAt - Date.now();

  // If less than 15 minutes until expiry, extend
  if (timeUntilExpiry < SLIDING_WINDOW && timeUntilExpiry > 0) {
    extendSession();
  }
};
```

## Testing Session Persistence

1. **Connect your wallet** - Session should be saved
2. **Refresh the page** - Should auto-restore (with passkey prompt)
3. **Wait for expiration** - Should require new login
4. **Clear session** - Should disconnect and require new login
5. **Open multiple tabs** - Changes should sync

## Best Practices

1. **Always use try-catch** when restoring sessions
2. **Show clear loading states** during restoration
3. **Let users opt-out** of session persistence
4. **Don't store sensitive data** in localStorage
5. **Set appropriate expiration** based on security needs

## Next Steps

- [Integrate token swaps](./04-token-swaps.md)
- [Build subscription billing](./05-subscription-billing.md)

## Troubleshooting

### Session not restoring
- Check localStorage is available (not in private mode with restrictions)
- Verify the session hasn't expired
- Check for errors in the console

### Multiple passkey prompts
- Ensure you're not calling `connect()` multiple times
- Check if `isRestoring` flag is being used properly

### Session cleared unexpectedly
- Another tab may have cleared it
- The session may have expired
- localStorage may have been cleared by the browser

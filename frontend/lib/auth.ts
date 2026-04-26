/**
 * Neon Auth SDK wrapper for PitchReady.
 * Provides session management, token access, and auth state subscription.
 */

import { createInternalNeonAuth } from '@neondatabase/auth';
import { redirect } from 'next/navigation';

// ---------------------------------------------------------------------------
// Singleton client
// ---------------------------------------------------------------------------

let _authClient: ReturnType<typeof createInternalNeonAuth> | null = null;

/**
 * Returns the singleton NeonAuth client.
 *
 * IMPORTANT: In the browser we point the BetterAuth client at the LOCAL Next.js
 * origin (i.e. window.location.origin = http://localhost:3000). The /api/auth
 * route handler proxies to Neon server-to-server, which:
 *   1. Avoids CORS preflight issues
 *   2. Sets session cookies on the correct (localhost) domain
 *   3. Allows getJWTToken() to read those cookies correctly
 */
export function initAuth(): ReturnType<typeof createInternalNeonAuth> {
    if (_authClient) return _authClient;

    // Browser: use same-origin Next.js API routes
    // SSR/Node: fall back to the configured auth URL
    const url =
        (typeof window !== 'undefined' && window.location.origin) ||
        process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
        '';
    if (!url) throw new Error('NEXT_PUBLIC_NEON_AUTH_URL is not set');

    _authClient = createInternalNeonAuth(url);
    return _authClient;
}

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

export interface AuthUser {
    id: string;
    email: string;
    name?: string;
}

export interface AuthSession {
    user: AuthUser;
    token: string;
}

// ---------------------------------------------------------------------------
// Auth utilities
// ---------------------------------------------------------------------------

/**
 * Returns the raw JWT access token string, or null if not authenticated.
 * Uses the NeonAuth client's getJWTToken() — the correct API.
 */
export async function getToken(): Promise<string | null> {
    try {
        const client = initAuth();
        const token = await client.getJWTToken();
        return token ?? null;
    } catch {
        return null;
    }
}

/**
 * Returns the current authenticated session, or null if not authenticated.
 * Decodes user claims from the JWT payload (no extra network call).
 */
export async function getSession(): Promise<AuthSession | null> {
    try {
        const token = await getToken();
        if (!token) return null;

        // Decode JWT payload (base64url middle segment — no verification needed client-side)
        const payloadB64 = token.split('.')[1];
        if (!payloadB64) return null;
        const claims = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));

        if (!claims?.sub) return null;

        return {
            user: {
                id: claims.sub,
                email: claims.email ?? '',
                name: claims.name ?? undefined,
            },
            token,
        };
    } catch {
        return null;
    }
}

/**
 * Signs out the current user, clears the session, and redirects to /login.
 */
export async function signOut(): Promise<void> {
    try {
        const client = initAuth();
        // BetterAuth client exposes signOut via adapter
        await (client as any).signOut?.();
    } catch {
        // Proceed to redirect even if signOut call fails
    }
    redirect('/login');
}

/**
 * Subscribes to auth state changes.
 * Calls callback immediately with the current session, then on each change.
 *
 * @param callback - Invoked with the new session (or null on sign-out)
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
    callback: (session: AuthSession | null) => void
): () => void {
    const client = initAuth();

    if (!(client as any).$store?.atoms?.session?.subscribe) {
        return () => { };
    }

    const unsubscribe = (client as any).$store.atoms.session.subscribe((val: any) => {
        const rawData = val?.data;
        if (!rawData?.user) {
            callback(null);
            return;
        }
        callback({
            user: {
                id: rawData.user.id,
                email: rawData.user.email ?? '',
                name: rawData.user.name ?? undefined,
            },
            token: rawData?.accessToken ?? rawData?.session?.token ?? rawData?.session?.accessToken ?? '',
        });
    });

    return unsubscribe;
}

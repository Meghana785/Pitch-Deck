'use client';

/**
 * Providers — wraps the app with React Query client and PostHog analytics.
 * Also subscribes to auth state changes to identify / reset PostHog users.
 *
 * Separated from layout.tsx so it can be a Client Component while layout
 * remains a Server Component.
 */

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { onAuthStateChange } from '@/lib/auth';

// ---------------------------------------------------------------------------
// React Query client
// ---------------------------------------------------------------------------

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                retry: 1,
            },
        },
    });
}

let _browserQueryClient: QueryClient | undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always create a new client (per request)
        return makeQueryClient();
    }
    // Browser: reuse singleton
    _browserQueryClient ??= makeQueryClient();
    return _browserQueryClient;
}

// ---------------------------------------------------------------------------
// PostHog init (browser-only)
// ---------------------------------------------------------------------------

let _posthogInitialized = false;

function initPostHog() {
    if (_posthogInitialized || typeof window === 'undefined') return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
        api_host: 'https://app.posthog.com',
        capture_pageview: false, // handled manually with Next.js router
        persistence: 'localStorage',
    });
    _posthogInitialized = true;
}

import { ThemeProvider } from '@/components/theme-provider';

// ---------------------------------------------------------------------------
// Providers component
// ---------------------------------------------------------------------------

export function Providers({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient();

    // PostHog init + auth-change subscription
    useEffect(() => {
        initPostHog();

        const unsubscribe = onAuthStateChange((session) => {
            if (session?.user) {
                posthog.identify(session.user.id, { email: session.user.email });
            } else {
                posthog.reset();
            }
        });

        return unsubscribe;
    }, []);

    return (
        <PostHogProvider client={posthog}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true} disableTransitionOnChange>
                    {children}
                </ThemeProvider>
            </QueryClientProvider>
        </PostHogProvider>
    );
}

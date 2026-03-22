'use client';

/**
 * ProtectedRoute — wraps pages that require authentication.
 * Shows a loading spinner while checking session, redirects to /login otherwise.
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSession, type AuthSession } from '@/lib/auth';

interface Props {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const [session, setSession] = useState<AuthSession | null | undefined>(undefined);

    useEffect(() => {
        getSession().then((s) => {
            if (!s) {
                router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
            }
            setSession(s);
        });
    }, [router, pathname]);

    // Still checking
    if (session === undefined) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-brand-red border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Authenticating…</p>
                </div>
            </div>
        );
    }

    // Redirect was triggered — render nothing
    if (!session) return null;

    return <>{children}</>;
}

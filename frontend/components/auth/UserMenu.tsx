'use client';

/**
 * UserMenu — a compact dropdown showing the user's email and a sign-out button.
 * Intended for use in the top navigation bar.
 */

import { useEffect, useRef, useState } from 'react';
import { getSession, signOut, type AuthSession } from '@/lib/auth';

export default function UserMenu() {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [open, setOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getSession().then(setSession);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleSignOut() {
        setSigningOut(true);
        await signOut();
    }

    if (!session) return null;

    const { user } = session;
    const initials = user.email.slice(0, 2).toUpperCase();

    return (
        <div ref={menuRef} className="relative">
            {/* Avatar button */}
            <button
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-brand-gold transition focus:outline-none"
            >
                <div className="w-8 h-8 rounded-full bg-brand-gray border border-brand-gold/30 flex items-center justify-center text-xs font-semibold text-brand-gold select-none">
                    {initials}
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-gray-900 border border-gray-800 shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-800">
                        <p className="text-xs text-gray-400 truncate">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {signingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                </div>
            )}
        </div>
    );
}

'use client';

/**
 * UserMenu — a compact dropdown showing the user's email and a sign-out button.
 * Intended for use in the top navigation bar.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
                className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-brand-red/30 transition focus:outline-none"
            >
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-xs font-sans font-bold text-zinc-600 dark:text-zinc-400 select-none shadow-sm">
                    {initials}
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-3 w-56 glass-panel overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/5">
                        <p className="text-[10px] font-sans font-bold text-zinc-400 uppercase tracking-widest">Account</p>
                        <p className="text-sm font-sans font-medium text-zinc-900 dark:text-white truncate">{user.email}</p>
                    </div>
                    <Link href="/settings" className="block w-full text-left px-4 py-3 text-[10px] font-sans font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        Settings
                    </Link>
                    <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full text-left px-4 py-3 text-[10px] font-sans font-bold uppercase tracking-widest text-brand-red hover:bg-brand-red/5 transition-colors disabled:opacity-50"
                    >
                        {signingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                </div>
            )}
        </div>
    );
}

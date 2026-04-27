'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from '@/components/auth/UserMenu';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'History', href: '/history' },
    { name: 'Library', href: '/vault' },
    { name: 'Methodology', href: '/methodology' },
    { name: 'Pricing', href: '/pricing' },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <header className="w-full flex justify-between items-center px-8 py-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/80 dark:bg-brand-black/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
            <div className="flex items-center gap-3">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-2 h-2 bg-brand-red rounded-full group-hover:scale-125 transition-transform" />
                    <span className="font-serif font-black text-zinc-900 dark:text-white text-xl uppercase tracking-[0.2em] leading-none">
                        Pitch<span className="text-brand-red">Ready</span>.
                    </span>
                </Link>
            </div>
            
            <div className="flex gap-8 items-center">
                <nav className="hidden md:flex gap-8 items-center border-r border-zinc-200 dark:border-white/5 pr-8">
                    {NAV_LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link 
                                key={link.href}
                                href={link.href} 
                                className={`text-[10px] font-sans font-bold uppercase tracking-widest transition-all ${
                                    isActive 
                                    ? 'text-brand-red' 
                                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                                }`}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}

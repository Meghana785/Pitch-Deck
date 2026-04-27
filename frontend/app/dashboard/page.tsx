'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { UsageBar } from '@/components/dashboard/UsageBar';
import { getSession } from '@/lib/auth';

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [runsUsed, setRunsUsed] = useState(0);
    const [runsLimit, setRunsLimit] = useState(3);
    const [plan, setPlan] = useState('free');
    const [userEmail, setUserEmail] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        getSession().then((session) => {
            if (!isMounted) return;

            if (session?.user) {
                setUserEmail(session.user.email);
                const claims = session.user as any;
                setRunsUsed(claims.runs_used ?? 0);
                setRunsLimit(claims.runs_limit ?? 3);
                setPlan(claims.plan ?? 'free');
            }
            setLoading(false);
        }).catch((err: unknown) => {
            const msg = (err as { message?: string })?.message || 'Failed to reach the server.';
            if (isMounted) {
                setLoadError(msg);
                setLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, []);

    const isLimitReached = plan === 'free' && runsUsed >= runsLimit;

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center transition-colors duration-300">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-12 h-12 border-2 border-brand-red/20 border-t-brand-red rounded-full animate-spin" />
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center selection:bg-brand-red/30 transition-colors duration-300">
                <Navbar />

                <main className="relative w-full max-w-6xl px-6 sm:px-8 py-16 flex flex-col gap-24">
                    {/* Top Section */}
                    <section className="flex flex-col gap-12">
                        <div className="flex flex-col gap-4">
                            <h1 className="text-4xl sm:text-6xl font-serif text-zinc-900 dark:text-white tracking-tighter leading-none uppercase">
                                Your <span className="text-brand-red italic">Dashboard.</span>
                            </h1>
                            <div className="flex items-center gap-4">
                                <span className="text-zinc-500 dark:text-zinc-600 font-sans font-bold uppercase tracking-[0.3em] text-[10px]">User: {userEmail || '---'}</span>
                                <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                            </div>
                        </div>

                        {loadError && (
                            <div className="p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-sm text-[10px] font-sans font-bold uppercase tracking-widest text-center">
                                [CONNECTION ERROR] {loadError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
                            <UsageBar runsUsed={runsUsed} runsLimit={runsLimit} plan={plan} />

                            <div className="glass-panel p-8 sm:p-10 flex flex-col justify-between gap-8 hover-lift">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-2xl font-serif text-zinc-900 dark:text-white italic">Start New Review</h3>
                                    <p className="text-zinc-600 dark:text-zinc-500 text-sm font-sans font-light leading-relaxed">Upload your pitch deck to get a detailed AI review of your business plan and strategy.</p>
                                </div>

                                <button
                                    onClick={() => router.push('/analyze')}
                                    disabled={isLimitReached}
                                    className="w-full py-4 bg-zinc-900 dark:bg-white disabled:bg-zinc-200 dark:disabled:bg-zinc-800 text-white dark:text-black font-sans font-bold uppercase tracking-widest text-[11px] rounded-sm transition-all flex items-center justify-center gap-4 group hover:bg-black dark:hover:bg-zinc-100"
                                >
                                    Analyze Pitch Deck
                                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Quick Access Info */}
                    <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 border-t border-zinc-200 dark:border-white/5">
                        <div className="flex flex-col gap-4 p-8 glass-panel hover-lift">
                            <span className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-widest">Report History</span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed italic">View and manage all your previous pitch deck analysis reports.</p>
                            <button onClick={() => router.push('/history')} className="mt-2 text-[10px] font-sans font-bold text-brand-red uppercase tracking-widest text-left hover:text-zinc-900 dark:hover:text-white transition-colors">View Reports →</button>
                        </div>
                        <div className="flex flex-col gap-4 p-8 glass-panel hover-lift">
                            <span className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-widest">Resource Library</span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed italic">Access pitch deck blueprints and successful industry benchmarks.</p>
                            <button onClick={() => router.push('/vault')} className="mt-2 text-[10px] font-sans font-bold text-brand-red uppercase tracking-widest text-left hover:text-zinc-900 dark:hover:text-white transition-colors">Open Library →</button>
                        </div>
                        <div className="flex flex-col gap-4 p-8 glass-panel hover-lift">
                            <span className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-widest">Contact Support</span>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed italic">Need help or looking for custom enterprise solutions for your team?</p>
                            <button onClick={() => router.push('/contact')} className="mt-2 text-[10px] font-sans font-bold text-brand-red uppercase tracking-widest text-left hover:text-zinc-900 dark:hover:text-white transition-colors">Get in Touch →</button>
                        </div>
                    </section>
                </main>
            </div>
        </ProtectedRoute>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import UserMenu from '@/components/auth/UserMenu';
import { UsageBar } from '@/components/dashboard/UsageBar';
import { RunCard } from '@/components/dashboard/RunCard';
import { getReports, type ReportSummary } from '@/lib/api';
import { getSession } from '@/lib/auth';

export default function DashboardPage() {
    const router = useRouter();
    const [reports, setReports] = useState<ReportSummary[]>([]);
    const [loading, setLoading] = useState(true);

    // Usage tracking from session claims (populated by Neon Auth custom user data or API sync)
    const [runsUsed, setRunsUsed] = useState(0);
    const [runsLimit, setRunsLimit] = useState(3);
    const [plan, setPlan] = useState('free');
    const [userEmail, setUserEmail] = useState('');
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        // Fetch session for usage claims + Reports in parallel
        Promise.all([getSession(), getReports()]).then(([session, data]) => {
            if (!isMounted) return;

            if (session?.user) {
                setUserEmail(session.user.email);
                // Assuming custom claims for billing are present on the Neon user object
                const claims = session.user as any;
                setRunsUsed(claims.runs_used ?? 0);
                setRunsLimit(claims.runs_limit ?? 3);
                setPlan(claims.plan ?? 'free');
            }

            // Sort most recent first
            const sorted = [...(data || [])].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setReports(sorted);
            setLoading(false);
        }).catch((err: unknown) => {
            const msg =
                (err as { message?: string })?.message ||
                'Failed to reach the server. Please try again.';
            console.log('[Dashboard] Failed to load dashboard data:', msg);
            if (isMounted) {
                setLoadError(msg);
                setLoading(false);
            }
        });

        return () => { isMounted = false; };
    }, []);

    const isLimitReached = plan === 'free' && runsUsed >= runsLimit;

    return (
        <ProtectedRoute>
            <div className="min-h-svh bg-brand-black flex flex-col items-center selection:bg-brand-red/30">
                {/* Navbar */}
                <header className="w-full flex justify-between items-center px-8 py-6 border-b border-brand-gray bg-brand-black/80 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border border-brand-red bg-brand-black flex items-center justify-center rounded-luxury">
                            <div className="w-2 h-2 bg-brand-red rounded-sm" />
                        </div>
                        <span className="font-serif font-bold text-white text-xl uppercase tracking-widest">PitchReady.</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <span className="hidden sm:inline text-xs font-sans text-zinc-500 uppercase tracking-[0.2em]">Dashboard Route</span>
                        <UserMenu />
                    </div>
                </header>

                <main className="relative w-full max-w-6xl px-6 sm:px-8 py-16 flex flex-col gap-16">

                    {/* Top Section */}
                    <section className="flex flex-col gap-8">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tighter mix-blend-difference mb-2">
                                REQUISITION CONTROL.
                            </h1>
                            <p className="text-zinc-500 font-sans font-light uppercase tracking-widest text-xs">
                                Operator: {userEmail ? userEmail : 'Unidentified'}
                            </p>
                        </div>

                        {/* Load Error Banner */}
                        {loadError && (
                            <div className="p-4 bg-brand-red/10 border border-brand-red text-brand-red rounded-luxury text-xs font-sans font-bold uppercase tracking-widest text-center">
                                [CONNECTION ERROR] {loadError}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                            <UsageBar runsUsed={runsUsed} runsLimit={runsLimit} plan={plan} />

                            <div className="flex border border-brand-gray bg-brand-black rounded-luxury p-6 shadow-2xl relative group overflow-hidden">
                                {/* Button glow hover effect */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(210,18,46,0.1),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="flex-1 flex flex-col justify-between relative z-10">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-serif text-white mb-2">Initialize New Execution</h3>
                                        <p className="text-zinc-500 text-sm font-sans font-light">Upload a deck document for immediate strategic dissection.</p>
                                    </div>

                                    <button
                                        onClick={() => router.push('/analyze')}
                                        disabled={isLimitReached}
                                        title={isLimitReached ? 'Upgrade to continue' : ''}
                                        className="w-full px-6 py-4 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-sans font-bold uppercase tracking-widest text-sm rounded-luxury transition-all duration-300 flex items-center justify-between"
                                    >
                                        Deploy Analyzer
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* History Section */}
                    <section className="flex flex-col gap-8">
                        <div className="flex items-end justify-between border-b border-brand-gray pb-4">
                            <h2 className="text-2xl font-serif text-white tracking-tight">
                                Intelligence Archive
                            </h2>
                            <span className="text-xs font-sans text-brand-red uppercase font-bold tracking-[0.2em] hidden sm:block">Log History</span>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="h-48 bg-zinc-900 rounded-luxury animate-pulse" />
                                <div className="h-48 bg-zinc-900 rounded-luxury animate-pulse delay-75" />
                                <div className="h-48 bg-zinc-900 rounded-luxury animate-pulse delay-150 hidden lg:block" />
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-16 bg-brand-black border border-brand-gray rounded-luxury overflow-hidden relative">
                                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)] pointer-events-none" />
                                <div className="relative z-10 w-12 h-12 bg-zinc-900 border border-brand-gray flex items-center justify-center mb-6 rounded-luxury transform rotate-45">
                                    <div className="w-3 h-3 bg-zinc-700 rounded-sm transform -rotate-45" />
                                </div>
                                <h3 className="text-xl font-serif text-white mb-2 relative z-10">Archive Empty.</h3>
                                <p className="text-sm font-sans text-zinc-500 text-center max-w-sm font-light mb-8 relative z-10">
                                    No strategic data models constructed. Initiate execution to generate intelligence.
                                </p>
                                <button
                                    onClick={() => router.push('/analyze')}
                                    disabled={isLimitReached}
                                    className="relative z-10 px-8 py-3 bg-transparent hover:bg-white text-white hover:text-black font-sans font-bold text-xs uppercase tracking-widest border border-white rounded-luxury transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
                                >
                                    Initiate Deployment
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {reports.map((run) => (
                                    <RunCard
                                        key={run.id || run.run_id}
                                        id={run.id}
                                        vertical={run.vertical}
                                        status={run.status as any}
                                        createdAt={run.created_at}
                                        runId={run.run_id}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                </main>
            </div>
        </ProtectedRoute>
    );
}

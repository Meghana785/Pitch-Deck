'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { RunCard } from '@/components/dashboard/RunCard';
import { getReports, deleteReport, type ReportSummary } from '@/lib/api';
import { getSession } from '@/lib/auth';

export default function HistoryPage() {
    const router = useRouter();
    const [reports, setReports] = useState<ReportSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [plan, setPlan] = useState('free');
    const [runsUsed, setRunsUsed] = useState(0);
    const [runsLimit, setRunsLimit] = useState(3);

    useEffect(() => {
        let isMounted = true;

        Promise.all([getSession(), getReports()]).then(([session, data]) => {
            if (!isMounted) return;

            if (session?.user) {
                const claims = session.user as any;
                setRunsUsed(claims.runs_used ?? 0);
                setRunsLimit(claims.runs_limit ?? 3);
                setPlan(claims.plan ?? 'free');
            }

            const sorted = [...(data || [])].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setReports(sorted);
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

    const handleDelete = async (runId: string) => {
        try {
            await deleteReport(runId);
            setReports((prev) => prev.filter((r) => r.run_id !== runId));
            setDeletingId(null);
        } catch (err) {
            console.error('Failed to delete report:', err);
            alert('Failed to delete report. Please try again.');
        }
    };

    const isLimitReached = plan === 'free' && runsUsed >= runsLimit;

    return (
        <ProtectedRoute>
            <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center selection:bg-brand-red/30 transition-colors duration-300">
                {/* Confirmation Modal */}
                {deletingId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-all" onClick={() => setDeletingId(null)} />
                        <div className="relative glass-panel p-8 sm:p-12 max-w-md w-full flex flex-col gap-8 shadow-2xl transition-all">
                            <div className="flex flex-col gap-3">
                                <h3 className="text-3xl font-serif text-zinc-900 dark:text-white tracking-tight italic">
                                    Delete Report?
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-500 font-sans leading-relaxed font-light">
                                    This action will permanently delete this analysis and all associated report data from your history. This cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setDeletingId(null)}
                                    className="flex-1 py-4 border border-zinc-200 dark:border-white/10 text-zinc-500 font-sans font-bold uppercase tracking-widest text-[10px] hover:text-zinc-900 dark:hover:text-white transition-all rounded-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleDelete(deletingId)}
                                    className="flex-1 py-4 bg-brand-red text-white font-sans font-bold uppercase tracking-widest text-[10px] hover:bg-brand-red-dark transition-all shadow-lg rounded-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Navbar />

                <main className="relative w-full max-w-6xl px-6 sm:px-8 py-16 flex flex-col gap-12">
                    <div className="flex flex-col gap-4">
                        <h1 className="text-4xl sm:text-6xl font-serif text-zinc-900 dark:text-white tracking-tighter leading-none italic">
                            Report History.
                        </h1>
                        <div className="flex items-center gap-4">
                            <span className="text-zinc-400 dark:text-zinc-600 font-sans font-bold uppercase tracking-[0.3em] text-[10px]">Your Analysis Records</span>
                            <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
                        </div>
                    </div>

                    {loadError && (
                        <div className="p-4 bg-brand-red/10 border border-brand-red/20 text-brand-red rounded-sm text-[10px] font-sans font-bold uppercase tracking-widest text-center italic">
                            [CONNECTION ERROR] {loadError}
                        </div>
                    )}

                    <section className="flex flex-col gap-12 mt-12">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="h-64 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-sm animate-pulse" />
                                ))}
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="glass-panel p-20 text-center flex flex-col items-center gap-8 hover-lift">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-2xl font-serif text-zinc-900 dark:text-white italic">History Empty.</h3>
                                    <p className="text-sm font-sans text-zinc-500 dark:text-zinc-500 max-w-sm font-light leading-relaxed">
                                        You haven't analyzed any pitch decks yet. Start a new analysis to see your reports here.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/analyze')}
                                    disabled={isLimitReached}
                                    className="px-10 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-sans font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-brand-red dark:hover:bg-brand-red dark:hover:text-white transition-all disabled:opacity-30 shadow-sm"
                                >
                                    Start Analysis
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {reports.map((run) => (
                                    <RunCard
                                        key={run.id || run.run_id}
                                        id={run.id}
                                        vertical={run.vertical}
                                        status={run.status as any}
                                        createdAt={run.created_at}
                                        runId={run.run_id}
                                        onDelete={(id) => setDeletingId(id)}
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

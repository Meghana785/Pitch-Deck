'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ReportHeader } from '@/components/report/ReportHeader';
import { AssumptionMap, type Assumption } from '@/components/report/AssumptionMap';
import { BlindSpotReport, type BlindSpot } from '@/components/report/BlindSpotReport';
import { SharpeningPrompts, type SharpeningAction } from '@/components/report/SharpeningPrompts';
import { getReport } from '@/lib/api';

interface ReportData {
    id: string;
    vertical: string;
    created_at?: string; // We'll mock if API misses it, or assume backend includes it implicitly
    assumption_map: Assumption[];
    blind_spots: BlindSpot[];
    sharpening: SharpeningAction[];
}

export default function ReportPage() {
    const params = useParams();
    const router = useRouter();
    const reportId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!reportId) return;

        let isMounted = true;
        setLoading(true);
        getReport(reportId)
            .then((data) => {
                if (isMounted) {
                    setReport({
                        id: data.id,
                        vertical: data.vertical,
                        assumption_map: data.assumption_map as Assumption[],
                        blind_spots: data.blind_spots as BlindSpot[],
                        sharpening: data.sharpening as SharpeningAction[],
                    });
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setError('Report not found or access denied.');
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [reportId]);

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-svh bg-brand-black flex flex-col items-center justify-center gap-6 selection:bg-brand-red/30">
                    <div className="w-64 h-8 bg-zinc-900 rounded-sm animate-pulse" />
                    <div className="w-96 h-32 bg-zinc-900 rounded-luxury animate-pulse delay-75" />
                    <div className="w-96 h-32 bg-zinc-900 rounded-luxury animate-pulse delay-150" />
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !report) {
        return (
            <ProtectedRoute>
                <div className="min-h-svh bg-brand-black flex flex-col items-center justify-center px-4 selection:bg-brand-red/30">
                    <div className="text-center bg-zinc-950 p-10 rounded-luxury border border-brand-red shadow-2xl max-w-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-red" />
                        <h2 className="text-2xl font-serif text-white mb-2 uppercase tracking-widest">Protocol Failed</h2>
                        <p className="text-zinc-500 font-sans text-xs uppercase tracking-widest mb-8">{error || 'This transmission may have been deleted.'}</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-4 bg-white hover:bg-zinc-300 text-black font-sans font-bold text-xs uppercase tracking-widest rounded-luxury shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors w-full"
                        >
                            Return to Base
                        </button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-svh bg-brand-black flex flex-col items-center text-zinc-100 selection:bg-brand-red/30">
                <div className="w-full max-w-5xl px-6 sm:px-8 flex flex-col pb-32">

                    <div className="pt-8 pb-4 sticky top-0 z-[60] bg-brand-black">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="group flex items-center gap-3 text-xs font-sans font-bold uppercase tracking-widest text-zinc-500 hover:text-brand-red transition-colors w-fit border-b border-transparent hover:border-brand-red pb-1"
                        >
                            <svg className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 group-hover:text-brand-red transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Command
                        </button>
                    </div>

                    <ReportHeader
                        vertical={report.vertical}
                        createdAt={report.created_at || new Date().toISOString()} // Fallback if API doesn't return created_at
                        assumptionCount={report.assumption_map?.length || 0}
                        blindSpotCount={report.blind_spots?.length || 0}
                        actionItemCount={report.sharpening?.length || 0}
                    />

                    <main className="flex flex-col gap-20 pt-10">
                        <AssumptionMap assumptions={report.assumption_map || []} />
                        <BlindSpotReport blindSpots={report.blind_spots || []} />
                        <SharpeningPrompts reportId={report.id} prompts={report.sharpening || []} />
                    </main>

                </div>
            </div>
        </ProtectedRoute>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ReportHeader } from '@/components/report/ReportHeader';
import { AssumptionMap, type Assumption } from '@/components/report/AssumptionMap';
import { BlindSpotReport, type BlindSpot } from '@/components/report/BlindSpotReport';
import { SharpeningPrompts, type SharpeningAction } from '@/components/report/SharpeningPrompts';
import { DetailedAnalysis } from '@/components/report/DetailedAnalysis';
import { HardQuestions, type HardQuestion } from '@/components/report/HardQuestions';
import { getReport } from '@/lib/api';

interface ReportData {
    id: string;
    vertical: string;
    created_at?: string;
    detailed_analysis: string;
    assumption_map: Assumption[];
    blind_spots: BlindSpot[];
    hard_questions: HardQuestion[];
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
                        created_at: data.created_at,
                        detailed_analysis: data.detailed_analysis || '',
                        assumption_map: data.assumption_map as Assumption[],
                        blind_spots: data.blind_spots as BlindSpot[],
                        hard_questions: data.hard_questions as HardQuestion[],
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
                <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center justify-center gap-6 selection:bg-brand-red/30 transition-colors duration-300">
                    <div className="w-64 h-8 bg-zinc-100 dark:bg-zinc-900 rounded-sm animate-pulse" />
                    <div className="w-96 h-32 bg-zinc-100 dark:bg-zinc-900 rounded-sm animate-pulse delay-75" />
                    <div className="w-96 h-32 bg-zinc-100 dark:bg-zinc-900 rounded-sm animate-pulse delay-150" />
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !report) {
        return (
            <ProtectedRoute>
                <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center justify-center px-4 selection:bg-brand-red/30 transition-colors duration-300">
                    <div className="text-center bg-white dark:bg-zinc-950 p-10 rounded-sm border border-brand-red shadow-2xl max-w-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-red" />
                        <h2 className="text-2xl font-serif text-zinc-900 dark:text-white mb-2 uppercase tracking-widest">Report Not Found</h2>
                        <p className="text-zinc-500 dark:text-zinc-500 font-sans text-xs uppercase tracking-widest mb-8">{error || 'The analysis report you are looking for is missing or deleted.'}</p>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-6 py-4 bg-zinc-900 dark:bg-white hover:bg-brand-red dark:hover:bg-zinc-300 text-white dark:text-black font-sans font-bold text-xs uppercase tracking-widest rounded-sm shadow-sm transition-colors w-full"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center text-zinc-900 dark:text-zinc-100 selection:bg-brand-red/30 transition-colors duration-300">
                <div className="w-full max-w-5xl px-6 sm:px-8 flex flex-col pb-32">

                    <ReportHeader
                        vertical={report.vertical}
                        createdAt={report.created_at || new Date().toISOString()}
                        assumptionCount={report.assumption_map?.length || 0}
                        blindSpotCount={report.blind_spots?.length || 0}
                        actionItemCount={report.sharpening?.length || 0}
                    />

                    <main className="flex flex-col gap-32 pt-20">
                        <DetailedAnalysis content={report.detailed_analysis} />
                        <AssumptionMap assumptions={report.assumption_map || []} />
                        <BlindSpotReport blindSpots={report.blind_spots || []} />
                        <HardQuestions questions={report.hard_questions || []} />
                        <SharpeningPrompts reportId={report.id} prompts={report.sharpening || []} />
                    </main>

                </div>
            </div>
        </ProtectedRoute>
    );
}

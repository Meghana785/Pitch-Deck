'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { FileUploader } from '@/components/analyze/FileUploader';
import { VerticalSelector } from '@/components/analyze/VerticalSelector';
import { PipelineProgress } from '@/components/analyze/PipelineProgress';
import { ReportRedirect } from '@/components/analyze/ReportRedirect';
import { uploadPresign, submitAnalysis } from '@/lib/api';
import UserMenu from '@/components/auth/UserMenu';

type PageState = 'idle' | 'uploading' | 'analyzing' | 'complete';

function AnalyzeContent() {
    const searchParams = useSearchParams();
    const initialRunId = searchParams.get('run_id');

    const [pageState, setPageState] = useState<PageState>('idle');

    // Form State
    const [file, setFile] = useState<File | null>(null);
    const [vertical, setVertical] = useState<string>('logistics_saas');

    // Process State
    const [uploadProgress, setUploadProgress] = useState(0);
    const [runId, setRunId] = useState<string | null>(null);
    const [reportId, setReportId] = useState<string | null>(null);

    // Global Error
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Resume flow
    useEffect(() => {
        if (initialRunId) {
            setRunId(initialRunId);
            setPageState('analyzing');
        }
    }, [initialRunId]);

    const handleStartAnalysis = async () => {
        if (!file) return;

        setErrorMsg(null);
        setPageState('uploading');
        setUploadProgress(0);

        try {
            // 1. Get Presigned URL
            const { presigned_url, object_key } = await uploadPresign(file.name, file.type, vertical);

            // 2. XMLHttpRequest for direct Spaces PUT (with progress)
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', presigned_url, true);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.setRequestHeader('x-amz-acl', 'private');

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const pct = Math.round((e.loaded / e.total) * 100);
                        setUploadProgress(pct);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.send(file);
            });

            // 3. Submit analysis
            const analysisData = await submitAnalysis(object_key, vertical);
            setRunId(analysisData.run_id);

            // 4. Begin SSE tracking sequence
            setPageState('analyzing');
        } catch (error: unknown) {
            // NEXT_REDIRECT is thrown by Next.js redirect() (e.g. signOut → redirect('/login')).
            // It must never be caught — re-throw so Next.js can navigate correctly.
            if (
                (error as { digest?: string })?.digest === 'NEXT_REDIRECT' ||
                (error as { message?: string })?.message === 'NEXT_REDIRECT'
            ) {
                throw error;
            }

            // API errors come back as normalized ApiError { status, message } plain objects.
            // Native errors have .message too — handle both shapes.
            const msg =
                (error as { message?: string })?.message ||
                'Failed to upload pitch. Please try again.';
            console.warn('[AnalyzePage] handleStartAnalysis:', msg);
            setErrorMsg(msg);
            setPageState('idle');
        }
    };

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
                        <span className="hidden sm:inline text-xs font-sans text-zinc-500 uppercase tracking-[0.2em]">Deployment Route</span>
                        <UserMenu />
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="w-full max-w-4xl flex-1 px-6 sm:px-8 flex flex-col pt-12 pb-20">
                    <div className="mb-12 text-center sm:text-left">
                        <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tighter mix-blend-difference mb-4">TACTICAL INGESTION</h1>
                        <p className="mt-2 text-zinc-500 font-sans font-light uppercase tracking-widest text-xs border-l-2 border-brand-red pl-4 py-1">
                            Supply deck data. The multi-agent array will construct the memo immediately.
                        </p>
                    </div>

                    <div className="bg-brand-black border border-brand-gray rounded-luxury p-8 sm:p-12 shadow-2xl relative overflow-hidden">
                        {/* Background structural lines */}
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_40px,rgba(255,255,255,0.01)_40px,rgba(255,255,255,0.01)_41px)] pointer-events-none" />

                        {/* STATE 1: IDLE */}
                        {pageState === 'idle' && (
                            <div className="flex flex-col gap-10 animate-in fade-in duration-300">
                                <div className="flex flex-col sm:flex-row gap-8">
                                    <div className="w-full sm:w-1/2">
                                        <FileUploader
                                            file={file}
                                            onFileSelect={(f) => setFile(f)}
                                        />
                                    </div>
                                    <div className="w-full sm:w-1/2">
                                        <VerticalSelector
                                            selectedVertical={vertical}
                                            onSelect={(v) => setVertical(v)}
                                        />
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div className="p-4 bg-brand-red/10 border border-brand-red text-brand-red rounded-luxury text-xs font-sans font-bold uppercase tracking-widest text-center mt-6">
                                        [ERROR] {errorMsg}
                                    </div>
                                )}

                                <div className="border-t border-brand-gray pt-8 mt-4 relative z-10 flex justify-end">
                                    <button
                                        onClick={handleStartAnalysis}
                                        disabled={!file}
                                        className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-zinc-300 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-black font-sans font-bold text-xs uppercase tracking-widest rounded-luxury shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all flex items-center justify-center gap-3"
                                    >
                                        Execute Sweep
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STATE 2: UPLOADING */}
                        {pageState === 'uploading' && (
                            <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in-95 duration-500 relative z-10">
                                <div className="w-full max-w-sm mb-8">
                                    <div className="flex justify-between font-sans text-xs uppercase tracking-widest font-bold mb-3">
                                        <span className={uploadProgress < 100 ? "text-brand-red" : "text-white"}>
                                            {uploadProgress < 100 ? 'Transmitting Data...' : 'Executing Sequence...'}
                                        </span>
                                        <span className="text-zinc-500 font-mono">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden border border-brand-gray">
                                        <div
                                            className="bg-brand-red h-full rounded-full transition-all duration-300 ease-out"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] uppercase font-mono text-zinc-600 mt-4 truncate text-center tracking-widest">
                                        {file?.name}
                                    </p>
                                </div>
                                {uploadProgress < 100 && (
                                    <button
                                        onClick={() => setPageState('idle')}
                                        className="text-[10px] text-zinc-500 hover:text-brand-red font-sans font-bold uppercase tracking-widest transition-colors border-b border-transparent hover:border-brand-red pb-1"
                                    >
                                        Abort
                                    </button>
                                )}
                            </div>
                        )}

                        {/* STATE 3: ANALYZING (SSE STREAM) */}
                        {pageState === 'analyzing' && runId && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <PipelineProgress
                                    runId={runId}
                                    onComplete={(rid) => {
                                        setReportId(rid);
                                        setPageState('complete');
                                    }}
                                    onError={(msg) => {
                                        setErrorMsg(`Analysis blocked: ${msg}`);
                                        setPageState('idle');
                                    }}
                                    onTimeout={() => {
                                        setErrorMsg('The analysis queue is busy. Try checking your dashboard shortly.');
                                        setPageState('idle');
                                    }}
                                />
                            </div>
                        )}

                        {/* STATE 4: COMPLETE */}
                        {pageState === 'complete' && reportId && (
                            <div className="animate-in fade-in zoom-in-95 duration-700">
                                <ReportRedirect
                                    reportId={reportId}
                                    onReset={() => {
                                        setFile(null);
                                        setPageState('idle');
                                        setRunId(null);
                                        setReportId(null);
                                    }}
                                />
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

export default function AnalyzePage() {
    return (
        <Suspense fallback={
            <div className="min-h-svh bg-brand-black flex items-center justify-center">
                <div className="w-6 h-6 border border-brand-red bg-brand-black flex items-center justify-center rounded-luxury animate-pulse">
                    <div className="w-2 h-2 bg-brand-red rounded-sm" />
                </div>
            </div>
        }>
            <AnalyzeContent />
        </Suspense>
    );
}

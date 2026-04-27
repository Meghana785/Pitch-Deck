'use client';

import React from 'react';
import Link from 'next/link';

interface RunCardProps {
    id: string; // Report ID (if done)
    vertical: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    createdAt: string;
    runId: string;
    onDelete: (runId: string) => void;
}

export function RunCard({ id, vertical, status, createdAt, runId, onDelete }: RunCardProps) {
    const dateStr = new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const verticalDisplay = (!vertical || vertical === 'auto')
        ? 'General Analysis'
        : vertical.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const isDone = status === 'done';

    return (
        <div className="group relative glass-panel p-8 hover-lift flex flex-col gap-8 h-full transition-colors duration-300">
            {/* Delete Button */}
            <button 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(runId);
                }}
                className="absolute top-4 right-4 p-2 text-zinc-400 dark:text-zinc-600 hover:text-brand-red opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                title="Delete from history"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                        {dateStr}
                    </span>
                    <span className={`text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                        status === 'done' ? 'border-brand-red/30 text-brand-red bg-brand-red/5' :
                        status === 'failed' ? 'border-red-900/30 text-red-500 bg-red-950/5 dark:bg-red-950/20' :
                        'border-zinc-200 dark:border-white/10 text-zinc-400 bg-zinc-50 dark:bg-zinc-900/40'
                    }`}>
                        {status}
                    </span>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-serif text-zinc-900 dark:text-white leading-tight italic">
                        {verticalDisplay}
                    </h3>
                    <p className="text-[9px] font-sans font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                        Pitch Readiness Review
                    </p>
                </div>
            </div>

            <div className="mt-auto">
                {isDone ? (
                    <Link
                        href={`/report/${id}`}
                        className="block w-full text-center py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-sans font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-brand-red dark:hover:bg-brand-red dark:hover:text-white transition-all shadow-sm"
                    >
                        View Report
                    </Link>
                ) : (
                    <Link
                        href={`/analyze?run_id=${runId}`}
                        className="block w-full text-center py-3 border border-zinc-200 dark:border-white/10 text-zinc-400 dark:text-zinc-500 font-sans font-bold uppercase tracking-widest text-[10px] rounded-sm hover:border-zinc-900 dark:hover:border-white hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
                    >
                        Check Progress
                    </Link>
                )}
            </div>
        </div>
    );
}

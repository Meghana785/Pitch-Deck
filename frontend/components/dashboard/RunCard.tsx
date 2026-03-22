'use client';

import React from 'react';
import Link from 'next/link';

interface RunCardProps {
    id: string; // Report ID (if done)
    vertical: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    createdAt: string;
    runId: string;
}

export function RunCard({ id, vertical, status, createdAt, runId }: RunCardProps) {
    const dateStr = new Date(createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const verticalDisplay = vertical === 'logistics_saas' ? 'B2B SaaS — Logistics' : vertical;

    let statusBadge = null;
    let actionButton = null;

    switch (status) {
        case 'done':
            statusBadge = (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-red/10 text-brand-red border border-brand-red/30 rounded-luxury text-xs font-sans font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-sm bg-brand-red" />
                    Complete
                </span>
            );
            actionButton = (
                <Link
                    href={`/report/${id}`}
                    className="w-full text-center px-4 py-3 border border-brand-gray bg-brand-black hover:border-brand-red text-white transition-colors duration-300 rounded-luxury text-sm font-sans font-bold uppercase tracking-widest"
                >
                    View Report
                </Link>
            );
            break;

        case 'running':
            statusBadge = (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-luxury text-xs font-sans font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-sm bg-zinc-400 animate-pulse" />
                    Analyzing
                </span>
            );
            actionButton = (
                <Link
                    href={`/analyze?run_id=${runId}`}
                    className="w-full text-center px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-luxury text-sm font-sans font-bold uppercase tracking-widest transition-colors duration-300"
                >
                    View Progress
                </Link>
            );
            break;

        case 'failed':
            statusBadge = (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-950 text-red-500 border border-red-900 rounded-luxury text-xs font-sans font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-sm bg-red-600" />
                    Failed
                </span>
            );
            actionButton = (
                <Link
                    href="/analyze"
                    className="w-full text-center px-4 py-3 border border-red-900 text-red-400 hover:bg-red-950/50 rounded-luxury text-sm font-sans font-bold uppercase tracking-widest transition-colors duration-300"
                >
                    Retry Upload
                </Link>
            );
            break;

        case 'queued':
        default:
            statusBadge = (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-gray-500 border border-brand-gray rounded-luxury text-xs font-sans font-bold uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-sm bg-gray-600" />
                    Queued
                </span>
            );
            actionButton = (
                <button
                    disabled
                    className="w-full text-center px-4 py-3 bg-brand-black border border-brand-gray text-zinc-600 rounded-luxury text-sm font-sans font-bold uppercase tracking-widest cursor-not-allowed"
                >
                    Pending
                </button>
            );
            break;
    }

    return (
        <div className="flex flex-col bg-brand-black border border-brand-gray hover:border-zinc-700 rounded-luxury p-6 transition-all duration-300 shadow-xl relative overflow-hidden group">
            {/* Subtle hover gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(210,18,46,0.05),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-zinc-500">
                        {verticalDisplay}
                    </span>
                    <span className="text-2xl font-serif font-bold text-white tracking-tight">
                        Pitch Readiness
                    </span>
                    <span className="text-xs font-sans text-zinc-600 uppercase tracking-widest">{dateStr}</span>
                </div>
                {statusBadge}
            </div>
            <div className="mt-auto pt-6 border-t border-brand-gray flex relative z-10">
                {actionButton}
            </div>
        </div>
    );
}

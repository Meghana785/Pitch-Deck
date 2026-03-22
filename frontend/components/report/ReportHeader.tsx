'use client';

import React from 'react';

interface ReportHeaderProps {
    vertical: string;
    createdAt: string;
    assumptionCount: number;
    blindSpotCount: number;
    actionItemCount: number;
}

export function ReportHeader({
    vertical,
    createdAt,
    assumptionCount,
    blindSpotCount,
    actionItemCount,
}: ReportHeaderProps) {
    // Format vertical string for display
    const verticalDisplay = vertical === 'logistics_saas' ? 'B2B SaaS — Logistics' : vertical;

    // Format date
    const dateDisplay = new Date(createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    // Calculate assumption pill color
    let assumptionColor = 'text-zinc-400 border-zinc-800';
    if (assumptionCount >= 4 && assumptionCount <= 7) {
        assumptionColor = 'text-amber-500 border-amber-900/50';
    } else if (assumptionCount > 7) {
        assumptionColor = 'text-brand-red border-brand-red/30';
    }

    return (
        <header className="w-full flex flex-col gap-8 sticky top-0 bg-brand-black/95 backdrop-blur-md z-50 pt-10 pb-6 border-b-2 border-brand-red">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 bg-brand-red rounded-sm shadow-[0_0_10px_rgba(210,18,46,0.5)]" />
                        <span className="font-serif font-black text-white text-2xl uppercase tracking-widest leading-none">PitchReady.</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-zinc-500 font-sans font-bold text-[10px] uppercase tracking-[0.2em]">Readiness Report // {verticalDisplay}</span>
                        <h1 className="text-5xl font-serif text-white tracking-tighter leading-none mt-1">EXECUTIVE SUMMARY</h1>
                        <span className="text-sm font-mono text-brand-red mt-2">TIMESTAMP: {dateDisplay}</span>
                    </div>
                </div>

                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-300 text-black font-sans font-bold text-xs uppercase tracking-widest rounded-luxury shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Dossier
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-brand-gray rounded-luxury overflow-hidden bg-zinc-950">
                <div className={`flex flex-col items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-brand-gray ${assumptionColor}`}>
                    <span className="text-5xl font-serif leading-none mb-1">{assumptionCount}</span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]">Assumptions</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 border-b sm:border-b-0 sm:border-r border-brand-gray text-white">
                    <span className="text-5xl font-serif leading-none mb-1">{blindSpotCount}</span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-zinc-500">Blind Spots</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-brand-red/10 text-brand-red relative overflow-hidden">
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(210,18,46,0.05)_10px,rgba(210,18,46,0.05)_20px)]" />
                    <span className="text-5xl font-serif leading-none mb-1 relative z-10">{actionItemCount}</span>
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] relative z-10">Directives</span>
                </div>
            </div>
        </header>
    );
}

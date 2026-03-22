'use client';

import React from 'react';

interface UsageBarProps {
    runsUsed: number;
    runsLimit: number;
    plan: string;
}

export function UsageBar({ runsUsed, runsLimit, plan }: UsageBarProps) {
    if (plan === 'pro') {
        return (
            <div className="flex items-center gap-4 bg-brand-black border border-brand-red/30 px-6 py-4 rounded-luxury shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-red/5 pointer-events-none" />
                <div className="w-8 h-8 rounded-luxury border border-brand-red bg-brand-black text-brand-red flex items-center justify-center relative z-10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div className="flex flex-col relative z-10">
                    <span className="text-xs font-sans uppercase tracking-[0.2em] text-brand-red font-bold">Pro Access</span>
                    <span className="text-sm font-sans text-zinc-400 font-light">Unlimited tactical analysis sweeps.</span>
                </div>
            </div>
        );
    }

    // Free plan logic
    const isAtLimit = runsUsed >= runsLimit;
    const isWarning = runsUsed === runsLimit - 1;

    let colorClass = 'bg-zinc-600';
    if (isAtLimit) colorClass = 'bg-brand-red shadow-[0_0_15px_rgba(210,18,46,0.6)]';
    else if (isWarning) colorClass = 'bg-brand-red/60';

    const percentage = Math.min((runsUsed / runsLimit) * 100, 100);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-brand-black border border-brand-gray p-6 rounded-luxury shadow-2xl relative overflow-hidden group">
            {/* Minimalist Background Hint */}
            <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />

            <div className="flex flex-col flex-1 relative z-10">
                <span className="text-xs font-sans font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
                    Analysis Requests
                </span>

                <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-serif font-black text-white leading-none">{runsUsed}</span>
                    <span className="text-lg font-sans text-zinc-600 font-light leading-snug pb-1">/ {runsLimit} executed</span>
                </div>

                <div className="w-full h-1 bg-zinc-900 overflow-hidden rounded-full">
                    <div
                        className={`h-full ${colorClass} transition-all duration-700 ease-[0.16,1,0.3,1]`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {isAtLimit && (
                <div className="flex-shrink-0 mt-4 sm:mt-0 flex flex-col gap-3 items-start sm:items-end relative z-10">
                    <span className="text-xs font-sans text-brand-red uppercase tracking-widest font-bold">Limit Reached</span>
                    <a
                        href="/pricing"
                        className="px-6 py-3 text-xs uppercase tracking-widest font-sans font-bold text-white bg-brand-red hover:bg-brand-red-dark border border-brand-red-dark rounded-luxury shadow-[0_0_20px_rgba(210,18,46,0.2)] hover:shadow-[0_0_30px_rgba(210,18,46,0.4)] transition-all duration-300"
                    >
                        Acquire Pro
                    </a>
                </div>
            )}
        </div>
    );
}

'use client';

import React from 'react';
import Link from 'next/link';

interface ReportRedirectProps {
    reportId: string;
    onReset: () => void;
    // Passing through optional context if fetched later
    numAssumptions?: number;
    numBlindSpots?: number;
}

export function ReportRedirect({ reportId, onReset, numAssumptions, numBlindSpots }: ReportRedirectProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Checkmark Animation Hub */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center relative z-10 shadow-2xl">
                    <svg
                        className="w-10 h-10 text-white animate-in zoom-in spin-in-12 duration-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            <h2 className="text-3xl font-serif text-zinc-900 dark:text-white tracking-tight mb-3 italic">
                Analysis Complete.
            </h2>

            <p className="text-zinc-500 font-sans font-light mb-10 max-w-md mx-auto leading-relaxed">
                {numAssumptions !== undefined && numBlindSpots !== undefined
                    ? `We found ${numAssumptions} assumptions and ${numBlindSpots} blind spots that require your attention.`
                    : `Your pitch has been fully analyzed against expert heuristics.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 w-full justify-center items-center">
                <Link
                    href={`/report/${reportId}`}
                    className="w-full sm:w-auto px-10 py-4 bg-brand-red text-white font-sans font-bold text-xs uppercase tracking-widest rounded-sm shadow-lg hover:bg-brand-red-dark transition-all"
                >
                    View Full Report
                </Link>
                <button
                    onClick={onReset}
                    className="w-full sm:w-auto px-10 py-4 bg-transparent border border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-sans font-bold text-xs uppercase tracking-widest rounded-sm transition-all"
                >
                    Analyze New Deck
                </button>
            </div>
        </div>
    );
}

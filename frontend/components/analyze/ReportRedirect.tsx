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
            <div className="relative mb-6">
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

            <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                Your readiness report is ready.
            </h2>

            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                {numAssumptions !== undefined && numBlindSpots !== undefined
                    ? `We found ${numAssumptions} assumptions and ${numBlindSpots} blind spots that require your attention.`
                    : `Your pitch has been fully analyzed against expert heuristics.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Link
                    href={`/report/${reportId}`}
                    className="px-6 py-3 rounded-lg bg-[#1A56DB] hover:bg-[#1E40AF] text-white font-medium shadow-md transition-colors"
                >
                    View Report
                </Link>
                <button
                    onClick={onReset}
                    className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium border border-gray-700 transition-colors"
                >
                    Analyze Another Deck
                </button>
            </div>
        </div>
    );
}

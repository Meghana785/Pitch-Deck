'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';

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
    const verticalDisplay = (!vertical || vertical === 'auto')
        ? 'General Analysis'
        : vertical.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const dateDisplay = new Date(createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <header className="w-full flex flex-col">
            <Navbar />

            <div className="pt-16 pb-12 flex flex-col gap-12 border-b border-zinc-200 dark:border-white/5 transition-colors duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-brand-red rounded-full" />
                            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
                                Pitch Deck Analysis
                            </span>
                        </div>
                        
                        <div className="flex flex-col">
                            <h1 className="text-4xl sm:text-5xl font-serif text-zinc-900 dark:text-white tracking-tight leading-none mb-2">
                                {verticalDisplay} Review
                            </h1>
                            <p className="text-sm font-sans text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">
                                Report Generated on {dateDisplay}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-12 flex-wrap sm:flex-nowrap">
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Assumptions</span>
                            <span className="text-xl font-serif text-brand-red italic">{assumptionCount}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Blind Spots</span>
                            <span className="text-xl font-serif text-brand-red italic">{blindSpotCount}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Tasks</span>
                            <span className="text-xl font-serif text-brand-red italic">{actionItemCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

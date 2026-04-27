'use client';

import React from 'react';

export interface BlindSpot {
    issue: string;
    severity: 'critical' | 'warning';
    mitigation: string;
}

interface BlindSpotReportProps {
    blindSpots: BlindSpot[];
}

export function BlindSpotReport({ blindSpots }: BlindSpotReportProps) {
    if (!blindSpots.length) return null;

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-brand-red" />
                <h2 className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    Blind Spots
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 glass-panel divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-white/5 overflow-hidden">
                {blindSpots.map((item, idx) => (
                    <div
                        key={idx}
                        className="p-8 sm:p-10 flex flex-col gap-6 hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-all duration-300 group hover-lift"
                    >
                        <div className="flex items-center gap-4">
                            <span className={`text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                                item.severity === 'critical' 
                                    ? 'bg-brand-red/10 text-brand-red border border-brand-red/20' 
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}>
                                {item.severity}
                            </span>
                        </div>

                        <div className="flex flex-col gap-4">
                            <h3 className={`text-lg font-serif leading-tight group-hover:italic transition-all ${item.severity === 'critical' ? 'text-brand-red' : 'text-zinc-900 dark:text-white'}`}>
                                {item.issue}
                            </h3>
                            
                            <div className="flex flex-col gap-2 pt-4 border-t border-zinc-100 dark:border-white/5">
                                <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                                    Mitigation Path
                                </p>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed italic">
                                    {item.mitigation}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

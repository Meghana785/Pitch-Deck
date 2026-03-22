'use client';

import React, { useState } from 'react';

export interface BlindSpot {
    question: string;
    why_it_matters: string;
    what_good_looks_like: string;
}

interface BlindSpotReportProps {
    blindSpots: BlindSpot[];
}

export function BlindSpotReport({ blindSpots }: BlindSpotReportProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    const toggle = (idx: number) => {
        setExpandedIndex(expandedIndex === idx ? null : idx);
    };

    if (!blindSpots.length) {
        return null;
    }

    return (
        <section className="flex flex-col gap-10 w-full mt-8">
            <div className="flex items-end gap-6 border-b-2 border-brand-gray pb-6">
                <span className="text-7xl font-serif text-brand-red leading-none -mb-2">II.</span>
                <div className="flex flex-col">
                    <h2 className="text-3xl font-serif text-white tracking-widest uppercase mb-2">Blind Spot Report</h2>
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Questions a domain expert will ask that you haven't answered.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {blindSpots.map((spot, idx) => {
                    const isExpanded = expandedIndex === idx;
                    const num = (idx + 1).toString().padStart(2, '0');

                    return (
                        <div
                            key={idx}
                            className={`flex flex-col border rounded-luxury overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-brand-black border-brand-red shadow-[0_0_15px_rgba(210,18,46,0.1)]' : 'bg-brand-black border-brand-gray hover:border-zinc-700'
                                }`}
                        >
                            <button
                                onClick={() => toggle(idx)}
                                className="w-full flex items-center justify-between p-6 sm:p-8 text-left focus:outline-none group"
                            >
                                <div className="flex items-start gap-6">
                                    <span className={`text-2xl font-serif mt-0.5 transition-colors ${isExpanded ? 'text-brand-red' : 'text-zinc-600 group-hover:text-zinc-400'}`}>{num}.</span>
                                    <span className={`text-xl sm:text-2xl font-serif pr-4 leading-tight transition-colors ${isExpanded ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                                        {spot.question}
                                    </span>
                                </div>
                                <div className={`text-brand-red transition-transform duration-500 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            <div
                                className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 border-t border-zinc-900' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-8 bg-zinc-950">
                                    <div className="flex-1 pl-6 border-l w-full sm:w-1/2 border-amber-500/50">
                                        <h4 className="text-[10px] font-sans font-bold text-amber-500 uppercase tracking-[0.2em] mb-3">
                                            [Why It Matters]
                                        </h4>
                                        <p className="text-sm text-zinc-300 leading-relaxed font-light">
                                            {spot.why_it_matters}
                                        </p>
                                    </div>
                                    <div className="flex-1 pl-6 border-l w-full sm:w-1/2 border-brand-red/50">
                                        <h4 className="text-[10px] font-sans font-bold text-brand-red uppercase tracking-[0.2em] mb-3">
                                            [What Good Looks Like]
                                        </h4>
                                        <p className="text-sm text-zinc-300 leading-relaxed font-light">
                                            {spot.what_good_looks_like}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

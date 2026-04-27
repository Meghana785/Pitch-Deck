'use client';

import React, { useMemo } from 'react';

export interface Assumption {
    assumption: string;
    risk: 'high' | 'medium' | 'low'; // AI outputs lowercase now
    why: string;
}

interface AssumptionMapProps {
    assumptions: Assumption[];
}

const RISK_MAP = {
    high: { border: 'bg-brand-red', label: 'High Risk' },
    medium: { border: 'bg-amber-500', label: 'Medium Risk' },
    low: { border: 'bg-zinc-500', label: 'Low Risk' },
};

const RISK_WEIGHT = { high: 1, medium: 2, low: 3 };

export function AssumptionMap({ assumptions }: AssumptionMapProps) {
    const sortedAssumptions = useMemo(() => {
        return [...assumptions].sort((a, b) => {
            const wA = RISK_WEIGHT[a.risk] || 99;
            const wB = RISK_WEIGHT[b.risk] || 99;
            return wA - wB;
        });
    }, [assumptions]);

    if (!sortedAssumptions.length) return null;

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-brand-red" />
                <h2 className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    Assumption Map
                </h2>
            </div>

            <div className="flex flex-col glass-panel divide-y divide-zinc-100 dark:divide-white/5 overflow-hidden">
                {sortedAssumptions.map((item, idx) => {
                    const riskStyle = RISK_MAP[item.risk] || RISK_MAP.low;
                    return (
                        <div
                            key={idx}
                            className="p-8 sm:p-10 flex flex-col gap-6 hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-all duration-300"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-1.5 h-1.5 rounded-full ${riskStyle.border}`} />
                                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                        {riskStyle.label}
                                    </span>
                                </div>
                            </div>

                             <div className="flex flex-col gap-4">
                                <h3 className={`text-lg sm:text-xl font-serif leading-tight italic ${item.risk === 'high' ? 'text-brand-red' : 'text-zinc-900 dark:text-white'}`}>
                                    "{item.assumption}"
                                </h3>
                                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                                    {item.why}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

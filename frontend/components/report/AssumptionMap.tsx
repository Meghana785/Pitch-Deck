'use client';

import React, { useMemo } from 'react';

export interface Assumption {
    assumption: string;
    category: string;
    risk_level: 'HIGH' | 'MED' | 'LOW';
    why_unproven: string;
}

interface AssumptionMapProps {
    assumptions: Assumption[];
}

const RISK_MAP = {
    HIGH: { border: 'border-l-brand-red', badge: 'bg-brand-red text-white', label: 'HIGH RISK' },
    MED: { border: 'border-l-amber-500', badge: 'bg-amber-500 text-black', label: 'MED RISK' },
    LOW: { border: 'border-l-zinc-500', badge: 'bg-zinc-800 text-zinc-300', label: 'LOW RISK' },
};

const RISK_WEIGHT = { HIGH: 1, MED: 2, LOW: 3 };

export function AssumptionMap({ assumptions }: AssumptionMapProps) {
    const sortedAssumptions = useMemo(() => {
        return [...assumptions].sort((a, b) => {
            const wA = RISK_WEIGHT[a.risk_level] || 99;
            const wB = RISK_WEIGHT[b.risk_level] || 99;
            return wA - wB;
        });
    }, [assumptions]);

    if (!sortedAssumptions.length) {
        return null;
    }

    return (
        <section className="flex flex-col gap-10 w-full mt-8">
            <div className="flex items-end gap-6 border-b-2 border-brand-gray pb-6">
                <span className="text-7xl font-serif text-brand-red leading-none -mb-2">I.</span>
                <div className="flex flex-col">
                    <h2 className="text-3xl font-serif text-white tracking-widest uppercase mb-2">Assumption Map</h2>
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Every unproven claim in your pitch, ranked by risk magnitude.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sortedAssumptions.map((item, idx) => {
                    const riskStyle = RISK_MAP[item.risk_level] || RISK_MAP.LOW;
                    return (
                        <div
                            key={idx}
                            className={`flex flex-col bg-brand-black border border-brand-gray p-8 border-l-4 ${riskStyle.border} shadow-sm rounded-r-luxury`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-zinc-500">
                                    {item.category || 'General'}
                                </span>
                                <span className={`px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest shadow-sm rounded-luxury ${riskStyle.badge}`}>
                                    {riskStyle.label}
                                </span>
                            </div>
                            <h3 className="text-2xl font-serif text-white mb-6 leading-tight">
                                "{item.assumption}"
                            </h3>
                            <div className="bg-zinc-950 p-6 border border-zinc-900 rounded-luxury relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-800" />
                                <p className="text-sm font-sans flex flex-col sm:flex-row gap-2">
                                    <span className="text-brand-red font-bold uppercase tracking-widest text-[10px] mt-0.5">Analysis:</span>
                                    <span className="text-zinc-300 leading-relaxed font-light">{item.why_unproven}</span>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

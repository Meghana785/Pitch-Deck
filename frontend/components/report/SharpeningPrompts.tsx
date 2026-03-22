'use client';

import React, { useEffect, useState } from 'react';

export interface SharpeningAction {
    action: string;
    rationale: string;
    priority: 'HIGH' | 'MED' | 'LOW';
}

interface SharpeningPromptsProps {
    reportId: string;
    prompts: SharpeningAction[];
}

const PRIORITY_MAP = {
    HIGH: 'bg-brand-red text-white border-brand-red font-bold',
    MED: 'bg-zinc-800 text-amber-500 border-zinc-700 font-bold',
    LOW: 'bg-zinc-900 text-zinc-500 border-zinc-800 font-bold',
};

export function SharpeningPrompts({ reportId, prompts }: SharpeningPromptsProps) {
    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
    const [mounted, setMounted] = useState(false);

    // Load state from localStorage
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem(`pitchready_report_${reportId}_actions`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setCheckedIds(new Set(parsed));
                }
            } catch (e) {
                // Safe fail
            }
        }
    }, [reportId]);

    const toggleCheck = (idx: number) => {
        const next = new Set(checkedIds);
        if (next.has(idx)) {
            next.delete(idx);
        } else {
            next.add(idx);
        }
        setCheckedIds(next);
        localStorage.setItem(`pitchready_report_${reportId}_actions`, JSON.stringify(Array.from(next)));
    };

    if (!prompts.length) {
        return null;
    }

    // Prevent layout shift/hydration mismatch gracefully
    if (!mounted) {
        return <div className="min-h-[200px]" />;
    }

    const completedCount = checkedIds.size;
    const isAllComplete = completedCount === prompts.length;

    return (
        <section className="flex flex-col gap-10 w-full mt-8">
            <div className="flex items-end gap-6 border-b-2 border-brand-gray pb-6">
                <span className="text-7xl font-serif text-brand-red leading-none -mb-2">III.</span>
                <div className="flex flex-col">
                    <h2 className="text-3xl font-serif text-white tracking-widest uppercase mb-2">Sharpening Directives</h2>
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Tactical adjustments required before your next interaction.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {prompts.map((item, idx) => {
                    const isChecked = checkedIds.has(idx);
                    const badgeStyle = PRIORITY_MAP[item.priority] || PRIORITY_MAP.LOW;

                    return (
                        <div
                            key={idx}
                            className={`flex items-start gap-6 p-6 sm:p-8 rounded-luxury border transition-all duration-300 ${isChecked
                                ? 'bg-zinc-950/50 border-zinc-900 opacity-50'
                                : 'bg-brand-black border-brand-gray hover:border-zinc-700'
                                }`}
                        >
                            <button
                                onClick={() => toggleCheck(idx)}
                                className={`mt-1 flex-shrink-0 w-8 h-8 rounded-sm border flex items-center justify-center transition-colors ${isChecked
                                    ? 'bg-white border-white text-black'
                                    : 'bg-zinc-900 border-zinc-700 hover:border-brand-red text-transparent hover:bg-brand-red/10'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>

                            <div className="flex flex-col gap-2 flex-1">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className={`px-3 py-1 text-[10px] font-sans uppercase tracking-[0.2em] rounded-luxury border shadow-sm ${badgeStyle}`}>
                                        {item.priority}
                                    </span>
                                    <h4 className={`text-xl font-serif ${isChecked ? 'line-through text-zinc-600' : 'text-white'}`}>
                                        {item.action}
                                    </h4>
                                </div>
                                <p className={`text-sm font-sans mt-2 font-light leading-relaxed ${isChecked ? 'text-zinc-700' : 'text-zinc-400'}`}>
                                    {item.rationale}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-zinc-950 rounded-luxury border border-brand-gray gap-4 mt-6">
                {isAllComplete ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-brand-red">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-sans font-bold text-xs uppercase tracking-widest text-center">
                            All directives executed. Proceed with deck revision and re-run analysis protocol.
                        </span>
                    </div>
                ) : (
                    <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                        <span className="text-white font-bold">{completedCount}</span> / {prompts.length} Directives Completed
                    </span>
                )}
            </div>
        </section>
    );
}

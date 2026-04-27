'use client';

import React from 'react';

export interface SharpeningAction {
    label: string;
    prompt: string;
}

interface SharpeningPromptsProps {
    reportId: string;
    prompts: SharpeningAction[];
}

export function SharpeningPrompts({ prompts }: SharpeningPromptsProps) {
    if (!prompts || prompts.length === 0) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // We could add a toast here, but keeping it simple as per user request
    };

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-brand-red" />
                <h2 className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    Action Items
                </h2>
            </div>

            <div className="flex flex-col gap-8">
                {prompts.map((item, idx) => (
                    <div
                        key={idx}
                        className="glass-panel p-8 sm:p-10 flex flex-col gap-6 hover-lift group"
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                                Task {String(idx + 1).padStart(2, '0')}
                            </span>
                            <h3 className="text-xl font-serif text-zinc-900 dark:text-white group-hover:italic transition-all">
                                {item.label}
                            </h3>
                        </div>

                        <div className="bg-zinc-50 dark:bg-black/40 p-6 rounded-sm border border-zinc-100 dark:border-white/5 relative group/prompt transition-colors duration-300">
                            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed">
                                {item.prompt}
                            </p>
                            <button
                                onClick={() => copyToClipboard(item.prompt)}
                                className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-brand-red dark:hover:bg-brand-red text-zinc-400 dark:text-zinc-500 hover:text-white dark:hover:text-white transition-all rounded-sm opacity-0 group-hover/prompt:opacity-100"
                                title="Copy to clipboard"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-sm text-center transition-colors duration-300">
                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-sans tracking-wide">
                    These suggested AI prompts help you address specific weaknesses in your pitch.
                </p>
            </div>
        </section>
    );
}

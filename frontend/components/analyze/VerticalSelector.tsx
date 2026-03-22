'use client';

import React from 'react';

interface VerticalOption {
    id: string;
    name: string;
    description: string;
    disabled: boolean;
    comingSoonText?: string;
}

const VERTICALS: VerticalOption[] = [
    {
        id: 'logistics_saas',
        name: 'B2B SaaS — Logistics',
        description: 'Logistics software, freight tech, supply chain platforms',
        disabled: false,
    },
    {
        id: 'health_dtc',
        name: 'DTC Healthcare',
        description: 'Direct-to-consumer health and wellness brands',
        disabled: true,
        comingSoonText: 'Coming soon',
    },
    {
        id: 'fintech',
        name: 'Fintech',
        description: 'B2B and B2C financial technology platforms',
        disabled: true,
        comingSoonText: 'Coming soon',
    },
    {
        id: 'edtech',
        name: 'EdTech',
        description: 'Educational technology and digital learning',
        disabled: true,
        comingSoonText: 'Coming soon',
    },
];

interface VerticalSelectorProps {
    selectedVertical: string;
    onSelect: (id: string) => void;
    disabled?: boolean;
}

export function VerticalSelector({ selectedVertical, onSelect, disabled }: VerticalSelectorProps) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-xs font-sans font-bold uppercase tracking-widest text-zinc-500">Target Vertical</h3>
            <div className="grid grid-cols-1 gap-4">
                {VERTICALS.map((v) => {
                    const isSelected = selectedVertical === v.id;
                    return (
                        <button
                            key={v.id}
                            disabled={v.disabled || disabled}
                            onClick={() => onSelect(v.id)}
                            className={`relative flex flex-col items-start p-6 rounded-luxury border text-left transition-all duration-300 ${v.disabled
                                ? 'bg-zinc-950/40 border-zinc-900 opacity-50 cursor-not-allowed'
                                : isSelected
                                    ? 'bg-brand-red/5 border-brand-red cursor-default shadow-[0_0_20px_rgba(210,18,46,0.1)]'
                                    : 'bg-brand-black border-brand-gray hover:border-zinc-700 cursor-pointer'
                                }`}
                        >
                            <div className="flex items-center justify-between w-full mb-2">
                                <span className={`font-serif text-lg ${isSelected ? 'text-brand-red font-bold' : 'text-zinc-300'}`}>
                                    {v.name}
                                </span>
                                {v.comingSoonText && (
                                    <span className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase bg-zinc-900 text-zinc-600 px-3 py-1 rounded-luxury border border-brand-gray">
                                        {v.comingSoonText}
                                    </span>
                                )}
                                {isSelected && (
                                    <div className="w-5 h-5 rounded-sm bg-brand-red flex items-center justify-center shadow-[0_0_10px_rgba(210,18,46,0.5)]">
                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-sans text-zinc-500 font-light">{v.description}</span>

                            {/* Subtle selection highlight */}
                            {isSelected && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-red rounded-l-luxury" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

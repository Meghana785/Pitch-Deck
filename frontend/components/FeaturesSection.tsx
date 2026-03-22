'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Feature {
    index: string;
    title: string;
    description: string;
    stat: string;
    statLabel: string;
    tag: string;
}

const features: Feature[] = [
    {
        index: "01",
        tag: "CORE ENGINE",
        title: "Deep Thesis Generation",
        description: "Multi-agent research and composition perfectly emulating elite investment memo structures. From raw data to boardroom-ready narrative.",
        stat: "10X",
        statLabel: "Faster Prep",
    },
    {
        index: "02",
        tag: "INTELLIGENCE LAYER",
        title: "Semantic Analysis API",
        description: "Scan thousands of datasets and cross-reference competitor strategies with zero latency. Every signal, parsed in real-time.",
        stat: "0ms",
        statLabel: "Latency",
    },
    {
        index: "03",
        tag: "RISK SURFACE",
        title: "Automated Diligence",
        description: "Flag risks, legal loopholes, and compliance blindspots automatically before you commit. Full-spectrum coverage so nothing slips through.",
        stat: "100%",
        statLabel: "Coverage",
    },
];

export function FeaturesSection() {
    return (
        <section
            id="features"
            className="py-24 bg-black text-white w-full relative z-10 overflow-hidden"
        >
            {/* Section Header */}
            <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
                    THE ANATOMY<br className="hidden sm:block" /> OF A PERFECT DEAL.
                </h2>
                <p className="text-zinc-500 max-w-xs text-sm font-light leading-relaxed sm:text-right">
                    Forget manual research. Our multi-agent system constructs bulletproof theses on demand.
                </p>
            </div>

            {/* Feature Rows */}
            <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                {features.map((feature, idx) => (
                    <FeatureRow key={feature.index} feature={feature} index={idx} />
                ))}
            </div>
        </section>
    );
}

function FeatureRow({ feature, index }: { feature: Feature; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="group relative cursor-default"
        >
            {/* Hover fill strip */}
            <div className="absolute inset-0 bg-brand-red/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-brand-red scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />

            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-12 gap-4 items-center">

                {/* Index */}
                <div className="col-span-2 sm:col-span-1">
                    <span className="text-xs font-mono text-zinc-600 tracking-[0.3em] group-hover:text-brand-red transition-colors duration-300">
                        {feature.index}
                    </span>
                </div>

                {/* Tag */}
                <div className="col-span-10 sm:col-span-2 flex items-center">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-zinc-600 border border-zinc-800 px-2 py-1 group-hover:border-brand-red/40 group-hover:text-zinc-400 transition-all duration-300">
                        {feature.tag}
                    </span>
                </div>

                {/* Title + Description */}
                <div className="col-span-12 sm:col-span-5 flex flex-col gap-2 sm:pl-4">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-white transition-colors duration-300">
                        {feature.title}
                    </h3>
                    <p className="text-zinc-500 text-sm leading-relaxed font-light max-w-sm group-hover:text-zinc-400 transition-colors duration-300">
                        {feature.description}
                    </p>
                </div>

                {/* Stat — massive editorial watermark style */}
                <div className="col-span-12 sm:col-span-4 flex items-center justify-start sm:justify-end gap-3 mt-4 sm:mt-0">
                    <div className="relative flex items-baseline gap-3">
                        <span className="text-5xl md:text-7xl font-black tracking-tighter text-white/10 group-hover:text-brand-red/70 transition-colors duration-500 select-none">
                            {feature.stat}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-red">
                                {feature.statLabel}
                            </span>
                            {/* Animated tick line */}
                            <span className="block h-[1px] w-0 bg-brand-red group-hover:w-12 transition-all duration-500 delay-100" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

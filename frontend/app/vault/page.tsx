'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

const BLUEPRINTS = [
    {
        id: 'saas-seed',
        title: 'SaaS Growth Secrets',
        category: 'SaaS',
        summary: 'Learn how to show that your software business can grow fast without wasting too much money.',
        lessons: [
            "The 13.8x Growth Rule: How to prove capital efficiency.",
            "Churn Mitigation: Showing you can keep the customers you get.",
            "The Rule of 40: Balancing growth and profit for Series A."
        ],
        difficulty: 'Beginner'
    },
    {
        id: 'fintech-trust',
        title: 'Safe Money Handling',
        category: 'Fintech',
        summary: 'How to prove to investors that your money-based app is safe, legal, and follows all the rules.',
        lessons: [
            "Compliance Moats: Turning legal hurdles into competitive edges.",
            "Risk Modeling: Showing you can handle market volatility.",
            "Trust Vectors: The 3 security certifications VCs look for first."
        ],
        difficulty: 'Advanced'
    },
    {
        id: 'logistics-moat',
        title: 'Building a Strong Business',
        category: 'Logistics',
        summary: 'Ways to make sure your physical business is hard for competitors to copy or steal from you.',
        lessons: [
            "Network Density: Why your first 100 hubs are the hardest.",
            "Unit Marginality: Proving that scale reduces your costs.",
            "Supply Chain Resilience: Planning for global disruption."
        ],
        difficulty: 'Standard'
    }
];

export default function VaultPage() {
    const [activeTab, setActiveTab] = useState('blueprints');

    return (
        <ProtectedRoute>
            <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center selection:bg-brand-red/30 transition-colors duration-300">
                <Navbar />

                <main className="relative w-full max-w-5xl px-6 sm:px-8 py-16 flex flex-col gap-24">
                    {/* Header */}
                    <section className="flex flex-col gap-12">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-sans font-bold text-brand-red uppercase tracking-[0.2em]">Blueprint Library</span>
                                <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                            </div>
                            <h1 className="text-5xl sm:text-7xl font-serif text-zinc-900 dark:text-white tracking-tighter leading-none uppercase">
                                Resource <span className="text-brand-red italic">Library.</span>
                            </h1>
                        </div>

                        <div className="flex gap-8 border-b border-zinc-200 dark:border-white/5">
                            {['blueprints', 'preparation-guide'].map((tab) => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-4 text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-all relative ${
                                        activeTab === tab ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-400'
                                    }`}
                                >
                                    {tab.replace(/-/g, ' ')}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-red" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Content Grid */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {(activeTab === 'blueprints' || activeTab === 'how-to-prepare') && BLUEPRINTS.map((bp) => (
                            <div key={bp.id} className="group flex flex-col gap-8 p-8 glass-panel hover-lift">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-sans font-bold text-brand-red uppercase tracking-widest px-2 py-0.5 border border-brand-red/20 rounded-sm bg-brand-red/5">
                                        {bp.category}
                                    </span>
                                    <span className="text-[9px] font-sans font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                                        {bp.difficulty}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-2xl font-serif text-zinc-900 dark:text-white tracking-tight leading-tight group-hover:italic transition-all">
                                        {bp.title}
                                    </h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-500 font-sans font-light leading-relaxed">
                                        {bp.summary}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4 py-4 border-y border-zinc-100 dark:border-white/5">
                                    <span className="text-[9px] font-sans font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Key Lessons:</span>
                                    <ul className="flex flex-col gap-3">
                                        {bp.lessons.map((lesson, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="w-1 h-1 bg-brand-red rounded-full mt-1.5" />
                                                <span className="text-[10px] font-sans font-light text-zinc-500 dark:text-zinc-400 leading-tight">{lesson}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button className="mt-auto w-full py-3 bg-zinc-900 dark:bg-transparent border border-zinc-900 dark:border-white/10 text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-white dark:text-zinc-500 group-hover:bg-brand-red dark:group-hover:bg-zinc-100 group-hover:border-brand-red dark:group-hover:border-white/20 dark:group-hover:text-white group-hover:text-white dark:group-hover:text-zinc-900 transition-all">
                                    View Full Guide
                                </button>
                            </div>
                        ))}

                        {activeTab === 'preparation-guide' && (
                            <div className="col-span-full glass-panel p-12 flex flex-col gap-12 hover-lift">
                                <div className="flex flex-col gap-4">
                                    <h2 className="text-3xl font-serif text-zinc-900 dark:text-white italic uppercase tracking-tighter">Preparation Checklist</h2>
                                    <p className="text-zinc-600 dark:text-zinc-500 max-w-2xl font-sans font-light leading-relaxed">
                                        Before you upload your pitch, check if you can answer these simple questions. If you can't, our AI will likely find a problem.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                                    {[
                                        { q: "The Biggest Risk", d: "What is the one thing that could break your whole plan if it goes wrong?" },
                                        { q: "Making Money", d: "Are you actually making a profit on each customer, or just spending money to get them?" },
                                        { q: "Stopping the Competition", d: "Why can't a big company just copy what you're doing tomorrow?" },
                                        { q: "Story vs Numbers", d: "Do your numbers actually back up the big promises you're making in your story?" }
                                    ].map((f, i) => (
                                        <div key={i} className="flex flex-col gap-2">
                                            <span className="text-brand-red font-mono text-[10px] uppercase font-bold">0{i+1}. {f.q}</span>
                                            <p className="text-sm text-zinc-900 dark:text-white font-sans font-medium">{f.d}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    <footer className="pt-12 border-t border-zinc-200 dark:border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-sans text-zinc-500 dark:text-zinc-600 uppercase tracking-widest italic leading-none">Shared Learning Library — Community Access</span>
                        <div className="flex gap-6">
                             <Link href="/dashboard" className="text-[9px] font-sans text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest transition-colors font-bold">
                                Back to Dashboard
                            </Link>
                        </div>
                    </footer>
                </main>
            </div>
        </ProtectedRoute>
    );
}

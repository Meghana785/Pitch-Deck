'use client';

import Navbar from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

export default function MethodologyPage() {
    return (
        <ProtectedRoute>
            <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center selection:bg-brand-red/30 transition-colors duration-300">
                <Navbar />

                <main className="relative w-full max-w-4xl px-6 sm:px-8 py-16 flex flex-col gap-24">
                    {/* Header */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-sans font-bold text-brand-red uppercase tracking-[0.2em]">Our Methodology</span>
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-white/5" />
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-serif text-zinc-900 dark:text-white tracking-tighter leading-none uppercase">
                            How We Test You.
                        </h1>
                    </section>

                    {/* Simple Steps */}
                    <section className="flex flex-col gap-12">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-serif text-zinc-900 dark:text-white italic">The 4 Steps to a Better Pitch</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-500 font-sans font-light leading-relaxed max-w-2xl">
                                We don't just look at your slides. We use a 4-step system to check if your business plan actually makes sense to an investor.
                            </p>
                        </div>

                        <div className="flex flex-col gap-8">
                            {[
                                { step: "01", name: "The Fact Finder", desc: "We look past the fancy words to find the real facts—your numbers, your goals, and who is on your team." },
                                { step: "02", name: "The Connection Checker", desc: "We check if your plans actually add up. For example, if you say you'll grow fast, we check if you have enough staff and money to do it." },
                                { step: "03", name: "The Hard Questioner", desc: "We act like a tough investor and find the most difficult question they might ask you in a real meeting." },
                                { step: "04", name: "The Final Review", desc: "We put everything together into a simple report that tells you exactly what you might have missed or gotten wrong." }
                            ].map((p, i) => (
                                <div key={i} className="flex flex-col sm:row gap-6 sm:gap-12 items-start group">
                                    <span className="text-brand-red font-mono text-[10px] pt-1 font-bold">STEP_{p.step}</span>
                                    <div className="flex flex-col gap-2 border-l border-zinc-200 dark:border-white/5 pl-8 group-hover:border-brand-red/30 transition-all">
                                        <h3 className="text-lg font-serif text-zinc-900 dark:text-white tracking-tight italic uppercase">{p.name}</h3>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-500 font-sans leading-relaxed max-w-xl">{p.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Why We Do It */}
                    <section className="glass-panel p-12 flex flex-col gap-8 hover-lift">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-serif text-zinc-900 dark:text-white italic">Why We Don't Give Out Simple Scores</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-500 font-sans font-light leading-relaxed max-w-2xl">
                                Other tools give you a score like "8 out of 10." We think that's unhelpful. A "good" score won't help you if an investor finds one huge mistake you didn't see.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pt-8 border-t border-zinc-100 dark:border-white/5">
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Finding the "Deal Killer"</span>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-sans leading-relaxed italic">
                                    Our goal is to find the one problem that would make an investor say "No" immediately. If you fix that, your chances of success go up massively.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Real Investor Thinking</span>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-sans leading-relaxed italic">
                                    We use the same logic that top investors use. We don't just check if your slides look pretty; we check if your business is strong.
                                </p>
                            </div>
                        </div>
                    </section>

                    <footer className="pt-12 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-sans text-zinc-400 dark:text-zinc-600 uppercase tracking-widest italic leading-none">Plain English Guide</span>
                        <Link href="/dashboard" className="text-[9px] font-sans text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest transition-colors font-bold">
                            Back to Dashboard
                        </Link>
                    </footer>
                </main>
            </div>
        </ProtectedRoute>
    );
}

'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { motion } from 'framer-motion';

export default function ContactPage() {
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        // Simulate API call
        setTimeout(() => setStatus('success'), 1500);
    };

    return (
    return (
        <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center selection:bg-brand-red/30 transition-colors duration-300">
            <Navbar />

            <main className="relative w-full max-w-4xl px-6 sm:px-8 py-24 flex flex-col gap-16">
                <section className="flex flex-col gap-4 text-center items-center">
                    <span className="text-[10px] font-sans font-bold text-brand-red uppercase tracking-[0.4em]">Contact Sales</span>
                    <h1 className="text-5xl sm:text-7xl font-serif text-zinc-900 dark:text-white tracking-tighter leading-none uppercase">
                        Get In Touch.
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-500 max-w-lg font-sans font-light leading-relaxed">
                        Learn how PitchReady can help your team analyze decks faster. 
                        We typically respond within 24 hours.
                    </p>
                </section>

                <div className="w-full max-w-2xl mx-auto">
                    {status === 'success' ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-12 border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950 rounded-sm text-center flex flex-col gap-6 shadow-sm dark:shadow-none"
                        >
                            <div className="w-12 h-12 bg-brand-red/10 border border-brand-red/20 rounded-full flex items-center justify-center mx-auto">
                                <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-serif text-zinc-900 dark:text-white italic">Message Sent.</h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-500 font-sans leading-relaxed">
                                We have received your message. <br />
                                Our team will contact you shortly.
                            </p>
                            <button 
                                onClick={() => window.location.href = '/dashboard'}
                                className="mt-4 text-[10px] font-sans font-bold text-brand-red uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-3 group">
                                    <label className="text-[10px] font-sans font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest group-focus-within:text-brand-red transition-colors">
                                        Full Name
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="E.G. ALEX REED"
                                        className="bg-transparent border-b border-zinc-300 dark:border-white/20 py-3 text-zinc-900 dark:text-white font-serif text-lg focus:outline-none focus:border-brand-red transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                    />
                                </div>
                                <div className="flex flex-col gap-3 group">
                                    <label className="text-[10px] font-sans font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest group-focus-within:text-brand-red transition-colors">
                                        Company Name
                                    </label>
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="E.G. PITCHREADY INC"
                                        className="bg-transparent border-b border-zinc-300 dark:border-white/20 py-3 text-zinc-900 dark:text-white font-serif text-lg focus:outline-none focus:border-brand-red transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 group">
                                <label className="text-[10px] font-sans font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest group-focus-within:text-brand-red transition-colors">
                                    Your Role
                                </label>
                                <div className="relative">
                                    <select 
                                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 py-4 px-4 text-zinc-900 dark:text-white font-serif focus:outline-none focus:border-brand-red focus:bg-white dark:focus:bg-zinc-900 transition-all appearance-none uppercase text-xs"
                                    >
                                        <option>Founder</option>
                                        <option>Investor</option>
                                        <option>Program Manager</option>
                                        <option>Executive</option>
                                        <option>Other</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 group">
                                <label className="text-[10px] font-sans font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest group-focus-within:text-brand-red transition-colors">
                                    How can we help?
                                </label>
                                <textarea 
                                    required
                                    rows={4}
                                    placeholder="TELL US ABOUT YOUR NEEDS..."
                                    className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 p-6 text-zinc-900 dark:text-white font-sans text-sm font-light focus:outline-none focus:border-brand-red focus:bg-white dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none leading-relaxed"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full py-6 bg-zinc-900 dark:bg-white text-white dark:text-black font-sans font-bold uppercase tracking-[0.4em] text-[11px] hover:bg-brand-red dark:hover:bg-brand-red dark:hover:text-white transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]"
                            >
                                {status === 'submitting' ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>

                <footer className="pt-12 border-t border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-[9px] font-sans text-zinc-400 dark:text-zinc-600 uppercase tracking-widest italic">Secure Messaging Active</span>
                    <span className="text-[9px] font-sans text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Support: hello@pitchready.ai</span>
                </footer>
            </main>
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

const CURRENCIES = {
    USD: { symbol: '$', rate: 1, label: 'USD' },
    EUR: { symbol: '€', rate: 0.92, label: 'EUR' },
    GBP: { symbol: '£', rate: 0.79, label: 'GBP' },
    INR: { symbol: '₹', rate: 83.35, label: 'INR' },
    JPY: { symbol: '¥', rate: 151.70, label: 'JPY' },
};

export default function PricingPage() {
    const [currency, setCurrency] = useState<keyof typeof CURRENCIES>('USD');

    const convert = (usdPrice: string) => {
        const price = parseFloat(usdPrice);
        if (price === 0) return '0';
        const converted = price * CURRENCIES[currency].rate;
        return converted.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    return (
        <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center selection:bg-brand-red/30 transition-colors duration-300">
            <Navbar />

            <main className="relative w-full max-w-6xl px-6 sm:px-8 py-24 flex flex-col gap-24">
                {/* Header */}
                <section className="flex flex-col items-center text-center gap-4">
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
                        <span className="text-[10px] font-sans font-bold text-brand-red uppercase tracking-[0.2em]">Select Your Access</span>
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-serif text-zinc-900 dark:text-white tracking-tighter leading-none uppercase">
                        Pricing <span className="text-brand-red italic">&</span> Plans.
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-500 max-w-lg font-sans font-light leading-relaxed">
                        Select the level of analysis you need for your current fundraising round.
                    </p>

                    {/* Currency Selector */}
                    <div className="mt-12 flex flex-col items-center gap-6">
                        <span className="text-[9px] font-sans font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em]">Select Currency</span>
                        <div className="flex items-center p-1 glass-panel rounded-full overflow-hidden">
                            {Object.keys(CURRENCIES).map((curr) => (
                                <button
                                    key={curr}
                                    onClick={() => setCurrency(curr as keyof typeof CURRENCIES)}
                                    className={`px-6 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all rounded-full ${
                                        currency === curr 
                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' 
                                        : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Grid */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            name: "Free",
                            price: "0",
                            desc: "Perfect for a quick logic check before your first draft.",
                            features: ["3 Analysis Runs / Month", "Standard Reviewer", "SaaS Resource Library", "7-Day History"],
                            cta: "Current Plan",
                            active: true
                        },
                        {
                            name: "Professional",
                            price: "29",
                            desc: "Designed for founders actively meeting with VCs.",
                            features: ["20 Analysis Runs / Month", "All Reviewer Styles", "Full Resource Library", "Unlimited History", "PDF Export Support"],
                            cta: "Upgrade to Pro",
                            active: false
                        },
                        {
                            name: "Enterprise",
                            price: "99",
                            desc: "Custom analysis for incubators and serial founders.",
                            features: ["Unlimited Analysis Runs", "Priority AI Queue", "Custom Reviewer Tuning", "Team Collaboration", "White-Label Reports"],
                            cta: "Contact Sales",
                            href: "/contact",
                            active: false
                        }
                    ].map((tier, i) => (
                        <div key={i} className={`flex flex-col gap-10 p-10 glass-panel hover-lift transition-all duration-300 group ${tier.active ? 'border-brand-red/30 bg-brand-red/5' : ''}`}>
                            <div className="flex flex-col gap-4">
                                <h3 className="text-xl font-serif text-zinc-900 dark:text-white uppercase italic tracking-widest">{tier.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-zinc-400 dark:text-zinc-500 font-sans mr-1">{CURRENCIES[currency].symbol}</span>
                                    <span className="text-4xl font-serif text-zinc-900 dark:text-white tracking-tighter italic">
                                        {convert(tier.price)}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans font-bold uppercase tracking-widest">/ month</span>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-sans font-light leading-relaxed">{tier.desc}</p>
                            </div>

                            <div className="h-px w-full bg-zinc-100 dark:bg-white/5" />

                            <ul className="flex flex-col gap-4">
                                {tier.features.map((feature, j) => (
                                    <li key={j} className="flex items-center gap-3">
                                        <div className="w-1 h-1 bg-brand-red rounded-full" />
                                        <span className="text-[10px] font-sans font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {tier.href ? (
                                <Link 
                                    href={tier.href}
                                    className="mt-auto w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-sans font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-brand-red dark:hover:bg-brand-red dark:hover:text-white transition-all text-center shadow-sm"
                                >
                                    {tier.cta}
                                </Link>
                            ) : (
                                <button className={`mt-auto w-full py-4 border transition-all rounded-sm text-[10px] font-sans font-bold uppercase tracking-widest ${tier.active ? 'border-brand-red text-brand-red bg-brand-red/5' : 'border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-900 dark:hover:border-white shadow-sm'}`}>
                                    {tier.cta}
                                </button>
                            )}
                        </div>
                    ))}
                </section>

                <footer className="pt-12 border-t border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <span className="text-[9px] font-sans text-zinc-400 dark:text-zinc-600 uppercase tracking-widest italic font-bold tracking-[0.2em]">Secure Payments processed via Stripe</span>
                    <div className="flex gap-8">
                        <Link href="/dashboard" className="text-[9px] font-sans text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest transition-colors font-bold">Privacy Policy</Link>
                        <Link href="/dashboard" className="text-[9px] font-sans text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest transition-colors font-bold">Terms of Service</Link>
                    </div>
                </footer>
            </main>
        </div>
    );
}

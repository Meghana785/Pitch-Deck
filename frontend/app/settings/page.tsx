'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getSession } from '@/lib/auth';
import { updatePreferences } from '@/lib/api';
import Link from 'next/link';

export default function SettingsPage() {
    const router = useRouter();
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [runsUsed, setRunsUsed] = useState(0);
    const [runsLimit, setRunsLimit] = useState(3);
    const [plan, setPlan] = useState('free');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Analysis Preferences State
    const [skepticLevel, setSkepticLevel] = useState('high'); // high, medium, supportive
    const [focusArea, setFocusArea] = useState('general'); // market, technical, financial

    useEffect(() => {
        getSession().then((session) => {
            if (session?.user) {
                setUserEmail(session.user.email);
                setUserId(session.user.id);
                const claims = session.user as any;
                setRunsUsed(claims.runs_used ?? 0);
                setRunsLimit(claims.runs_limit ?? 3);
                setPlan(claims.plan ?? 'free');
                
                // Set preferences from claims if they exist
                if (claims.skeptic_level) setSkepticLevel(claims.skeptic_level);
                if (claims.focus_area) setFocusArea(claims.focus_area);
            }
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus('idle');
        try {
            await updatePreferences(skepticLevel, focusArea);
            setSaveStatus('success');
            // Reset status after a delay
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error(err);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const progress = Math.min((runsUsed / runsLimit) * 100, 100);

    return (
        <ProtectedRoute>
            <div className="min-h-svh bg-white dark:bg-brand-black flex flex-col items-center selection:bg-brand-red/30 transition-colors duration-300">
                <Navbar />

                <main className="relative w-full max-w-4xl px-6 sm:px-8 py-16 flex flex-col gap-24">
                    {/* Page Header */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-[0.2em] hover:text-zinc-900 dark:hover:text-white transition-colors">
                                Dashboard
                            </Link>
                            <span className="text-zinc-300 dark:text-zinc-800">/</span>
                            <span className="text-[10px] font-sans font-bold text-brand-red uppercase tracking-[0.2em]">Settings</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-serif text-zinc-900 dark:text-white tracking-tighter leading-none">
                            Account Settings.
                        </h1>
                    </section>

                    {/* Operator Identity */}
                    <section className="flex flex-col gap-12">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-600 whitespace-nowrap">
                                Your Profile
                            </h2>
                            <div className="h-px w-full bg-zinc-100 dark:bg-white/5" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-sans font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">Email Address</span>
                                <span className="text-lg font-serif text-zinc-900 dark:text-white">{userEmail || '---'}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-sans font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-widest">User ID</span>
                                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 break-all">{userId || '---'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Payload & Billing */}
                    <section className="flex flex-col gap-12">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-600 whitespace-nowrap">
                                Plan & Usage
                            </h2>
                            <div className="h-px w-full bg-zinc-100 dark:bg-white/5" />
                        </div>

                        <div className="glass-panel p-8 flex flex-col gap-8 hover-lift">
                            <div className="flex justify-between items-end">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-sans font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Active Plan</span>
                                    <span className="text-2xl font-serif text-zinc-900 dark:text-white uppercase italic tracking-tight">{plan} Tier</span>
                                </div>
                                <div className="text-right flex flex-col gap-1">
                                    <span className="text-[9px] font-sans font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Analysis Used</span>
                                    <span className="text-xl font-serif text-zinc-900 dark:text-white">{runsUsed} / {runsLimit}</span>
                                </div>
                            </div>

                            <div className="relative h-1 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="absolute top-0 left-0 h-full bg-brand-red transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(210,18,46,0.4)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-4 border-t border-zinc-100 dark:border-white/5">
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 font-sans font-light italic">
                                    Capacity resets monthly. Upgrade to Professional for unlimited usage.
                                </p>
                                <Link href="/pricing" className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-sans font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-brand-red dark:hover:bg-brand-red dark:hover:text-white transition-all shadow-sm">
                                    Upgrade Plan
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Intelligence Profile */}
                    <section className="flex flex-col gap-12">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[10px] font-sans font-bold uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-600 whitespace-nowrap">
                                Analysis Preferences
                            </h2>
                            <div className="h-px w-full bg-zinc-100 dark:bg-white/5" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-lg font-serif text-zinc-900 dark:text-white italic">Reviewer Style</h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-light">Adjust how strictly the AI reviews your pitch deck logic.</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {['high', 'medium', 'supportive'].map((level) => (
                                        <button 
                                            key={level}
                                            onClick={() => setSkepticLevel(level)}
                                            className={`w-full py-3 px-4 border text-[10px] font-sans font-bold uppercase tracking-widest rounded-sm text-left transition-all flex justify-between items-center ${
                                                skepticLevel === level 
                                                ? 'border-brand-red bg-brand-red/5 text-zinc-900 dark:text-white' 
                                                : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-zinc-400 dark:hover:border-white/20'
                                            }`}
                                        >
                                            {level}
                                            {skepticLevel === level && <div className="w-1.5 h-1.5 bg-brand-red rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-lg font-serif text-zinc-900 dark:text-white italic">Primary Focus</h3>
                                    <p className="text-xs text-zinc-500 leading-relaxed font-light">Choose which area the AI should prioritize in your final report.</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {['general', 'technical', 'financial', 'market'].map((area) => (
                                        <button 
                                            key={area}
                                            onClick={() => setFocusArea(area)}
                                            className={`w-full py-3 px-4 border text-[10px] font-sans font-bold uppercase tracking-widest rounded-sm text-left transition-all flex justify-between items-center ${
                                                focusArea === area 
                                                ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white bg-zinc-100 dark:bg-white/5' 
                                                : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-zinc-400 dark:hover:border-white/20'
                                            }`}
                                        >
                                            {area}
                                            {focusArea === area && <div className="w-1 h-1 bg-zinc-900 dark:bg-white rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end items-center gap-6">
                            {saveStatus === 'success' && <span className="text-[10px] font-sans font-bold text-green-600 uppercase tracking-widest animate-pulse">Preferences Saved</span>}
                            {saveStatus === 'error' && <span className="text-[10px] font-sans font-bold text-brand-red uppercase tracking-widest">Update Failed</span>}
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className={`px-12 py-4 border ${saving ? 'border-zinc-200 dark:border-white/10 text-zinc-400' : 'border-brand-red bg-brand-red text-white hover:bg-transparent hover:text-brand-red'} text-[10px] font-sans font-bold uppercase tracking-widest transition-all rounded-sm`}
                            >
                                {saving ? 'Saving Changes...' : 'Save Preferences'}
                            </button>
                        </div>
                    </section>

                    <footer className="pt-12 border-t border-zinc-200 dark:border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-sans text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">PitchReady Version 1.0.4</span>
                        <button className="text-[9px] font-sans text-zinc-400 hover:text-brand-red uppercase tracking-widest transition-colors font-bold">
                            Deactivate Account
                        </button>
                    </footer>
                </main>
            </div>
        </ProtectedRoute>
    );
}

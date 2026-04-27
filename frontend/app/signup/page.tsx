'use client';

/**
 * Signup page — defaults to sign-up view, same premium design as login.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Link from 'next/link';

type View = 'sign-in' | 'sign-up';

export default function SignupPage() {
    const router = useRouter();
    const [view, setView] = useState<View>('sign-up');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 1024);
        check();
        window.addEventListener('resize', check);
        getSession().then((s) => { if (s) router.replace('/dashboard'); });
        return () => window.removeEventListener('resize', check);
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = view === 'sign-in' ? '/auth/login' : '/auth/signup';
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            
            const res = await fetch(`${backendUrl}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'Authentication failed');
                setLoading(false);
                return;
            }

            // Save session
            const { setSession } = await import('@/lib/auth');
            setSession(data.access_token, {
                id: data.user.id,
                email: data.user.email,
                plan: data.user.plan
            });

            router.replace('/dashboard');
        } catch (err) {
            setError('Connection failed. Please ensure the backend is running.');
            setLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 2,
        color: '#e5e5e5', fontFamily: "'Inter', sans-serif", fontSize: 14, padding: '11px 13px',
        outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease', WebkitAppearance: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: '#52525b', marginBottom: 6, fontFamily: "'Inter', sans-serif",
    };

    return (
        <main className="min-h-svh w-full flex bg-white dark:bg-brand-black transition-colors duration-300 font-sans">
            {isDesktop && (
                <div className="w-[65%] flex flex-col justify-between p-16 border-r border-zinc-200 dark:border-white/5 relative overflow-hidden bg-zinc-50 dark:bg-brand-black">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(210,18,46,0.05),transparent_55%)] pointer-events-none" />
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-25 bg-[repeating-linear-gradient(0deg,transparent,transparent_79px,#1a1a1a_79px,#1a1a1a_80px),repeating-linear-gradient(90deg,transparent,transparent_79px,#1a1a1a_80px)]" />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-7 h-7 bg-brand-red rounded-sm flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-white/90 rounded-xs" />
                        </div>
                        <span className="font-serif text-lg font-bold text-zinc-900 dark:text-white tracking-[0.25em] uppercase">PitchReady.</span>
                    </div>

                    <div className="relative z-10 max-w-[520px]">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-7 h-px bg-brand-red" />
                            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 tracking-[0.3em] uppercase">Pitch Analysis Platform</span>
                        </div>
                        <h1 className="font-serif text-[clamp(68px,8vw,104px)] leading-[0.88] tracking-tighter text-zinc-900 dark:text-white mb-9">
                            YOUR<br /><span className="text-brand-red italic">EDGE</span><br />STARTS<br />HERE.
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-500 text-base leading-relaxed border-l-2 border-brand-red pl-5 font-light max-w-[400px]">
                            Join founders who use PitchReady to analyze their strategy and craft investment-grade decks in under 4 minutes.
                        </p>
                        <div className="flex gap-12 mt-14">
                            {[{ num: '97%', label: 'Accuracy' }, { num: '< 4m', label: 'Analysis Time' }, { num: '∞', label: 'Industries' }].map(({ num, label }) => (
                                <div key={label}>
                                    <div className="font-serif text-2xl font-bold text-zinc-900 dark:text-white mb-1">{num}</div>
                                    <div className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-800 uppercase tracking-widest font-mono">Version 2.4.1</span>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-600 uppercase tracking-widest font-mono">System Live</span>
                        </div>
                    </div>
                </div>
            )}

            <div className={`flex flex-col justify-center items-center bg-white dark:bg-[#070707] relative transition-colors duration-300 ${isDesktop ? 'w-[35%]' : 'w-full'} ${isDesktop ? 'px-12 py-16' : 'px-6 py-12'}`}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-red/50 to-transparent" />
                <div className="w-full max-w-[340px]">
                    {!isDesktop && (
                        <div className="flex items-center gap-2 mb-12 justify-center">
                            <div className="w-5.5 h-5.5 bg-brand-red rounded-sm" />
                            <span className="font-serif text-lg font-bold text-zinc-900 dark:text-white tracking-[0.25em] uppercase">PitchReady.</span>
                        </div>
                    )}
                    <div className="mb-7">
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-600 uppercase tracking-[0.3em] font-bold mb-2.5">{view === 'sign-in' ? 'Sign In' : 'Create Account'}</p>
                        <h2 className="font-serif text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">{view === 'sign-in' ? 'Welcome Back.' : 'Get Started.'}</h2>
                    </div>
                    <div className="flex border border-zinc-200 dark:border-white/5 rounded-sm mb-7 overflow-hidden">
                        {(['sign-in', 'sign-up'] as View[]).map((v, i) => (
                            <button 
                                key={v} 
                                onClick={() => { setView(v); setError(''); }} 
                                className={`flex-1 py-3 text-[10px] font-bold tracking-widest uppercase cursor-pointer transition-all duration-200 ${i > 0 ? 'border-l border-zinc-200 dark:border-white/5' : ''} ${view === v ? 'bg-brand-red text-white' : 'text-zinc-500 dark:text-zinc-600 bg-transparent hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                {v === 'sign-in' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>
                    <div className="border border-zinc-200 dark:border-white/5 rounded-sm p-7 bg-zinc-50 dark:bg-[#050505] relative shadow-sm dark:shadow-none">
                        <div className="absolute top-0 right-0 w-14 h-14 border-t border-r border-brand-red/10 dark:border-brand-red/25 pointer-events-none" />
                        {error && (
                            <div className="bg-brand-red/5 border border-brand-red rounded-sm text-brand-red text-[11px] p-3 mb-5">{error}</div>
                        )}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
                            {view === 'sign-up' && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-600">Full Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-[#1c1c1c] rounded-sm text-zinc-900 dark:text-zinc-200 text-sm px-3.5 py-2.5 outline-none focus:border-brand-red transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700" />
                                </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-600">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-[#1c1c1c] rounded-sm text-zinc-900 dark:text-zinc-200 text-sm px-3.5 py-2.5 outline-none focus:border-brand-red transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center mb-0.5">
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 dark:text-zinc-600">Password</label>
                                    {view === 'sign-in' && <button type="button" className="text-[10px] text-zinc-400 dark:text-zinc-600 hover:text-brand-red transition-colors">Forgot password?</button>}
                                </div>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-[#1c1c1c] rounded-sm text-zinc-900 dark:text-zinc-200 text-sm px-3.5 py-2.5 outline-none focus:border-brand-red transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700" />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full mt-5 bg-brand-red text-white py-3.5 rounded-sm text-[10px] font-bold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-900 dark:hover:bg-white dark:hover:text-black shadow-lg dark:shadow-none'}`}
                            >
                                {loading ? (<><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>) : (view === 'sign-in' ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>
                    </div>
                    <div className="mt-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-[#141414]" />
                        <Link href="/" className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-bold no-underline hover:text-brand-red transition-colors">Return Home</Link>
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-[#141414]" />
                    </div>
                </div>
            </div>
        </main>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getToken } from '@/lib/auth';
import Link from 'next/link';

type View = 'sign-in' | 'sign-up';

// Route auth calls through the local Next.js /api/auth handler.
// This proxies server-to-server to Neon Auth, avoids CORS, and sets cookies on localhost.
async function callNeonAuth(path: string, body: object): Promise<{ error?: string }> {
    try {
        const res = await fetch(`/api/auth/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { error: data?.message || data?.error || `Error ${res.status}` };
        }
        return {};
    } catch {
        return { error: 'Connection failed. Please try again.' };
    }
}

export default function LoginPage() {
    const router = useRouter();
    const [view, setView] = useState<View>('sign-in');
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

        if (view === 'sign-in') {
            const { error: err } = await callNeonAuth('sign-in/email', { email, password });
            if (err) { setError(err); setLoading(false); return; }
        } else {
            const { error: err } = await callNeonAuth('sign-up/email', { email, password, name });
            if (err) { setError(err); setLoading(false); return; }
        }

        // Poll for session
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 300));
            const s = await getSession();
            if (s) { router.replace('/dashboard'); return; }
        }
        setError('Sign in successful but session not found. Please refresh.');
        setLoading(false);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        background: '#0a0a0a',
        border: '1px solid #1c1c1c',
        borderRadius: 2,
        color: '#e5e5e5',
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        padding: '11px 13px',
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s ease',
        WebkitAppearance: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: '#52525b',
        marginBottom: 6,
        fontFamily: "'Inter', sans-serif",
    };

    return (
        <main style={{ minHeight: '100svh', width: '100%', display: 'flex', backgroundColor: '#050505', fontFamily: "'Inter', sans-serif" }}>
            {/* ── LEFT HERO PANEL ── */}
            {isDesktop && (
                <div style={{ width: '65%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px', borderRight: '1px solid #1a1a1a', position: 'relative', overflow: 'hidden', backgroundColor: '#050505' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 0% 100%, rgba(210,18,46,0.1), transparent 55%)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.25, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 79px, #1a1a1a 79px, #1a1a1a 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, #1a1a1a 80px)' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '100%', background: 'linear-gradient(to bottom, transparent, rgba(210,18,46,0.3), transparent)' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1px', background: 'linear-gradient(to right, rgba(210,18,46,0.4), transparent)' }} />

                    {/* Logo */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, backgroundColor: '#D2122E', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 10, height: 10, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 1 }} />
                        </div>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '0.25em', textTransform: 'uppercase' }}>PitchReady.</span>
                    </div>

                    {/* Hero */}
                    <div style={{ position: 'relative', zIndex: 10, maxWidth: 520 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
                            <div style={{ width: 28, height: 1, backgroundColor: '#D2122E' }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#52525b', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Investor Intelligence Platform</span>
                        </div>
                        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(68px, 8vw, 104px)', lineHeight: 0.88, letterSpacing: '-0.03em', color: '#fff', margin: '0 0 36px 0' }}>
                            THE<br /><span style={{ color: '#D2122E', fontStyle: 'italic' }}>ART</span><br />OF<br />EXECUTION.
                        </h1>
                        <p style={{ color: '#52525b', fontSize: 16, lineHeight: 1.7, borderLeft: '2px solid #D2122E', paddingLeft: 20, margin: 0, fontWeight: 300, maxWidth: 400 }}>
                            PitchReady deconstructs your strategy and mathematically structures the perfect investment memo before you enter the room.
                        </p>
                        <div style={{ display: 'flex', gap: 48, marginTop: 56 }}>
                            {[{ num: '97%', label: 'Accuracy' }, { num: '< 4m', label: 'Time to Memo' }, { num: '∞', label: 'Verticals' }].map(({ num, label }) => (
                                <div key={label}>
                                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{num}</div>
                                    <div style={{ fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#292929', textTransform: 'uppercase', letterSpacing: '0.25em', fontFamily: 'monospace' }}>System v2.4.1 • Orbital Routing Active</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                            <span style={{ fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'monospace' }}>Live</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RIGHT AUTH PANEL ── */}
            <div style={{ width: isDesktop ? '35%' : '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: isDesktop ? '64px 48px' : '48px 24px', backgroundColor: '#070707', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, rgba(210,18,46,0.5), transparent)' }} />

                <div style={{ width: '100%', maxWidth: 340 }}>
                    {!isDesktop && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48, justifyContent: 'center' }}>
                            <div style={{ width: 22, height: 22, backgroundColor: '#D2122E', borderRadius: 2 }} />
                            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '0.25em', textTransform: 'uppercase' }}>PitchReady.</span>
                        </div>
                    )}

                    <div style={{ marginBottom: 28 }}>
                        <p style={{ fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: 700, margin: '0 0 10px 0' }}>
                            {view === 'sign-in' ? 'Access Portal' : 'Create Account'}
                        </p>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                            {view === 'sign-in' ? 'Welcome Back.' : 'Get Started.'}
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', border: '1px solid #1a1a1a', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
                        {(['sign-in', 'sign-up'] as View[]).map((v, i) => (
                            <button key={v} onClick={() => { setView(v); setError(''); }} style={{ flex: 1, padding: 12, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', border: 'none', borderLeft: i > 0 ? '1px solid #1a1a1a' : 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", backgroundColor: view === v ? '#D2122E' : 'transparent', color: view === v ? '#fff' : '#52525b', transition: 'all 0.15s ease' }}>
                                {v === 'sign-in' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    {/* Form card */}
                    <div style={{ border: '1px solid #1a1a1a', borderRadius: 2, padding: 28, backgroundColor: '#050505', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 56, height: 56, borderTop: '1px solid rgba(210,18,46,0.25)', borderRight: '1px solid rgba(210,18,46,0.25)', pointerEvents: 'none' }} />

                        {error && (
                            <div style={{ background: 'rgba(210,18,46,0.06)', border: '1px solid #D2122E', borderRadius: 2, color: '#D2122E', fontSize: 11, padding: '10px 12px', marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {view === 'sign-up' && (
                                <div style={{ marginBottom: 18 }}>
                                    <label style={labelStyle}>Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Jane Smith"
                                        required
                                        style={inputStyle}
                                        onFocus={e => (e.target.style.borderColor = '#D2122E')}
                                        onBlur={e => (e.target.style.borderColor = '#1c1c1c')}
                                    />
                                </div>
                            )}

                            <div style={{ marginBottom: 18 }}>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="jane@fund.com"
                                    required
                                    style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = '#D2122E')}
                                    onBlur={e => (e.target.style.borderColor = '#1c1c1c')}
                                />
                            </div>

                            <div style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label style={{ ...labelStyle, margin: 0 }}>Password</label>
                                    {view === 'sign-in' && (
                                        <span style={{ fontSize: 10, color: '#52525b', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Forgot password?</span>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = '#D2122E')}
                                    onBlur={e => (e.target.style.borderColor = '#1c1c1c')}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{ width: '100%', marginTop: 20, background: loading ? '#8A0303' : '#D2122E', color: '#fff', border: 'none', borderRadius: 2, fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', padding: 14, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                {loading ? (
                                    <>
                                        <div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                        Processing...
                                    </>
                                ) : (
                                    view === 'sign-in' ? 'Access System' : 'Create Account'
                                )}
                            </button>
                        </form>

                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: '#141414' }} />
                        <Link href="/" style={{ fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, textDecoration: 'none' }}
                            onMouseOver={e => (e.currentTarget.style.color = '#D2122E')}
                            onMouseOut={e => (e.currentTarget.style.color = '#3f3f46')}
                        >
                            Return to Origin
                        </Link>
                        <div style={{ flex: 1, height: 1, backgroundColor: '#141414' }} />
                    </div>
                </div>
            </div>
        </main>
    );
}

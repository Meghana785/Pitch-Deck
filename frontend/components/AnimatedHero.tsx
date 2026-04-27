'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

export function AnimatedHero() {
    const [mounted, setMounted] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: mounted ? containerRef : undefined,
        offset: ['start start', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

    useEffect(() => {
        setMounted(true);
        getSession().then(session => {
            if (session?.user) setIsLoggedIn(true);
        });
    }, []);

    if (!mounted) {
        return <div className="min-h-svh w-full bg-brand-bg transition-colors duration-300" />; // SSR blank fallback
    }

    return (
        <section
            ref={containerRef}
            className="relative min-h-svh w-full flex flex-col items-center justify-center overflow-hidden bg-brand-bg text-zinc-900 dark:text-white transition-colors duration-300"
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.03),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,50,0.4),rgba(0,0,0,1)_70%)]" />

            <motion.div
                style={{ opacity, y }}
                className="relative z-10 container max-w-7xl mx-auto px-6 pt-32 pb-24"
            >
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/5 backdrop-blur-md"
                    >
                        <Sparkles className="w-4 h-4 text-brand-red" />
                        <span className="text-sm font-medium tracking-wide text-zinc-600 dark:text-white">
                            PitchReady V1 is Live
                        </span>
                    </motion.div>

                    {/* Heading — Neo-Retro Luxury: serif for dramatic typographic impact */}
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 1,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.1
                        }}
                        className="font-serif text-6xl sm:text-7xl md:text-9xl font-black tracking-tighter leading-[0.9]"
                    >
                        PITCH <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-red-500">
                            PERFECT.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 1,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.2
                        }}
                        className="mt-10 text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-light max-w-2xl leading-relaxed"
                    >
                        The <span className="text-brand-red dark:text-brand-red/80 font-medium">multi-agent AI engine</span> that analyzes, structures, and generates your <span className="text-brand-red dark:text-brand-red/80 font-medium italic">investment thesis</span> in seconds, not weeks.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 1,
                            ease: [0.16, 1, 0.3, 1],
                            delay: 0.3
                        }}
                        className="mt-12 flex flex-col sm:flex-row gap-6 items-center"
                    >
                        <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                            <button className="group relative cursor-pointer px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold text-lg overflow-hidden flex items-center gap-2">
                                <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1">
                                    {isLoggedIn ? "Go to Dashboard" : "Get Started"}
                                </span>
                                <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                                <div className="absolute inset-0 bg-brand-red transform origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 mix-blend-difference" />
                            </button>
                        </Link>

                        <Link href="#features">
                            <button className="cursor-pointer px-8 py-4 text-zinc-900 dark:text-white font-medium text-lg relative group transition-colors duration-300 hover:text-brand-red">
                                Explore Engine
                                <span className="absolute bottom-3 left-8 right-8 h-[1px] bg-brand-red transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-brand-bg to-transparent z-20 pointer-events-none" />
        </section>
    );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function AnimatedHero() {
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: mounted ? containerRef : undefined,
        offset: ['start start', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-svh w-full bg-black" />; // SSR blank fallback
    }

    return (
        <section
            ref={containerRef}
            className="relative min-h-svh w-full flex flex-col items-center justify-center overflow-hidden bg-black text-white"
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,50,0.4),rgba(0,0,0,1)_70%)]" />

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
                        className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
                    >
                        <Sparkles className="w-4 h-4 text-brand-red" />
                        <span className="text-sm font-medium tracking-wide">
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
                        className="mt-10 text-xl md:text-2xl text-zinc-400 font-light max-w-2xl leading-relaxed"
                    >
                        The multi-agent AI engine that analyzes, structures, and generates your investment thesis in seconds, not weeks.
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
                        <Link href="/signup">
                            <button className="group relative cursor-pointer px-8 py-4 bg-white text-black font-semibold text-lg overflow-hidden flex items-center gap-2">
                                <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1">Get Started</span>
                                <ArrowRight className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                                <div className="absolute inset-0 bg-brand-red transform origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 mix-blend-difference" />
                            </button>
                        </Link>

                        <Link href="#features">
                            <button className="cursor-pointer px-8 py-4 text-white font-medium text-lg relative group transition-colors duration-300 hover:text-brand-red">
                                Explore Engine
                                <span className="absolute bottom-3 left-8 right-8 h-[1px] bg-brand-red transform origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                            </button>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-linear-to-t from-black to-transparent z-20 pointer-events-none" />
        </section>
    );
}

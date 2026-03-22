'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function CallToAction() {
    return (
        <section className="relative w-full py-32 bg-black flex shadow-[inset_0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute inset-0 z-0">
                {/* Animated Radial gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#d2122e_0%,transparent_50%)] opacity-20" />
            </div>

            <div className="z-10 container mx-auto px-6 text-center max-w-4xl pt-16 border-t border-brand-red/30">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="font-sans text-white text-5xl md:text-8xl font-black tracking-tighter mb-8"
                >
                    READY TO DOMINATE?
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="text-zinc-300 text-lg md:text-2xl font-light max-w-2xl mx-auto mb-16"
                >
                    Stop wasting weeks on due diligence. PitchReady converts raw data into actionable deployment strategies instantly.
                </motion.p>

                <Link href="/signup">
                    <motion.button
                        whileHover={{ backgroundColor: '#8A0303' }}
                        whileTap={{ scale: 0.97 }}
                        className="cursor-pointer px-12 py-5 bg-brand-red text-white font-extrabold tracking-widest uppercase text-xl transition-shadow duration-300 shadow-[0_0_40px_rgba(210,18,46,0.3)] hover:shadow-[0_0_60px_rgba(210,18,46,0.5)]"
                    >
                        Start Analyzing
                    </motion.button>
                </Link>
            </div>
        </section>
    );
}

export function Footer() {
    return (
        <footer className="w-full bg-black py-12 px-6 border-t border-white/5 relative z-10 text-zinc-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="font-bold text-2xl tracking-tighter text-white">
                    Pitch<span className="text-brand-red">Ready</span>.
                </div>

                <div className="flex gap-8 text-sm font-medium">
                    <Link href="#" className="hover:text-white transition-colors duration-200">Documentation</Link>
                    <Link href="#" className="hover:text-white transition-colors duration-200">Privacy</Link>
                    <Link href="#" className="hover:text-white transition-colors duration-200">Terms of Service</Link>
                </div>

                <div className="text-sm">
                    &copy; {new Date().getFullYear()} Orbrot Systems. All rights reserved.
                </div>
            </div>
        </footer>
    );
}

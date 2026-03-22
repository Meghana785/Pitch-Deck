import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
});

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-serif',
});

export const metadata: Metadata = {
    title: 'PitchReady — Stress-test your pitch before you\'re in the room',
    description:
        'AI-powered pitch deck analysis that finds your blind spots before investors do.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${playfair.variable} dark`} data-scroll-behavior="smooth" suppressHydrationWarning>
            <body className="font-sans bg-brand-black text-gray-100 antialiased" suppressHydrationWarning>
                {/* Grain Texture */}
                <div className="grain-overlay" />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}

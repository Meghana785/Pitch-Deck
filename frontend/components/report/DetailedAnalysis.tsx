import React from 'react';

interface DetailedAnalysisProps {
    content: string;
}

export const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ content }) => {
    if (!content) return null;

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-brand-red" />
                <h2 className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    Executive Analysis
                </h2>
            </div>

            <div className="glass-panel p-8 sm:p-12">
                <div className="max-w-3xl mx-auto">
                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        {content.split('\n\n').map((paragraph, idx) => (
                            <p 
                                key={idx} 
                                className="text-zinc-700 dark:text-zinc-300 font-sans text-base sm:text-lg leading-relaxed mb-8 last:mb-0"
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

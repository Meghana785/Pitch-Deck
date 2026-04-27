import React from 'react';

export interface HardQuestion {
    question: string;
    why_it_matters: string;
}

interface HardQuestionsProps {
    questions: HardQuestion[];
}

export const HardQuestions: React.FC<HardQuestionsProps> = ({ questions }) => {
    if (!questions || questions.length === 0) return null;

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-brand-red" />
                <h2 className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                    Key Questions
                </h2>
            </div>

            <div className="flex flex-col glass-panel divide-y divide-zinc-100 dark:divide-white/5 overflow-hidden">
                {questions.map((q, idx) => (
                    <div 
                        key={idx}
                        className="p-8 sm:p-10 flex flex-col sm:flex-row gap-6 sm:gap-12 hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-all duration-300 hover-lift group"
                    >
                        <div className="sm:w-1/12 flex-shrink-0">
                            <span className="text-[10px] font-sans font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
                                {String(idx + 1).padStart(2, '0')}
                            </span>
                        </div>

                        <div className="sm:w-5/12 flex-shrink-0">
                            <h3 className="text-base sm:text-lg font-serif text-zinc-900 dark:text-white leading-snug group-hover:italic transition-all">
                                {q.question}
                            </h3>
                        </div>

                        <div className="sm:w-6/12 flex flex-col gap-2">
                            <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-brand-red">
                                Strategic Importance
                            </p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                                {q.why_it_matters}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

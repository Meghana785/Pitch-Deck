'use client';

import React, { useEffect, useState } from 'react';
import { getToken } from '@/lib/auth';

interface PipelineProgressProps {
    runId: string;
    onComplete: (reportId: string) => void;
    onError: (message: string) => void;
    onTimeout: () => void;
}

const STEPS = [
    'Extracting pitch structure',
    'Mapping assumptions',
    'Domain expert interrogation',
    'Synthesizing report',
];

const ROTATING_TIPS = [
    'The Domain Interrogator is reviewing 150+ logistics SaaS failure patterns',
    'Checking your assumptions against real investor objections',
    'Mapping your competitive blind spots against known market leaders',
    'Building your sharpening prompts from the ground up',
];

export function PipelineProgress({ runId, onComplete, onError, onTimeout }: PipelineProgressProps) {
    const [completedAgents, setCompletedAgents] = useState<Set<number>>(new Set());
    const [latencies, setLatencies] = useState<Record<number, number>>({});
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [tipIndex, setTipIndex] = useState(0);
    const [currentAgent, setCurrentAgent] = useState(1);

    // Time tracking
    useEffect(() => {
        const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Tip rotation
    useEffect(() => {
        const timer = setInterval(() => {
            setTipIndex((i) => (i + 1) % ROTATING_TIPS.length);
        }, 8000);
        return () => clearInterval(timer);
    }, []);

    // SSE streaming loop
    useEffect(() => {
        const controller = new AbortController();

        async function streamProgress() {
            try {
                const token = await getToken();
                if (!token) throw new Error('Not authenticated');

                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                const response = await fetch(`${apiUrl}/jobs/${runId}/stream`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (!response.ok || !response.body) {
                    throw new Error('Failed to connect to progress stream');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() || ''; // keep the last incomplete chunk

                    for (const part of parts) {
                        if (part.startsWith(':')) continue; // keepalive comment
                        const dataMatch = part.match(/data:\s*(.+)/);
                        if (!dataMatch) continue;

                        const payloadStr = dataMatch[1];
                        try {
                            const payload = JSON.parse(payloadStr);

                            switch (payload.event) {
                                case 'agent_complete':
                                    const agentNum = payload.agent;
                                    setCompletedAgents((prev) => new Set(prev).add(agentNum));
                                    setLatencies((prev) => ({ ...prev, [agentNum]: payload.latency_ms }));
                                    setCurrentAgent(agentNum + 1);
                                    break;

                                case 'done':
                                    onComplete(payload.report_id);
                                    return; // exit loop safely

                                case 'failed':
                                    onError(payload.message || 'Analysis failed');
                                    return;

                                case 'timeout':
                                    onTimeout();
                                    return;
                            }
                        } catch (err) {
                            console.warn('Failed to parse SSE payload', payloadStr, err);
                        }
                    }
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                onError(err.message || 'Stream connection lost');
            }
        }

        streamProgress();
        return () => controller.abort();
    }, [runId, onComplete, onError, onTimeout]);

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center mt-12">
            {/* Header Readout */}
            <div className="w-full flex items-center justify-between mb-12 pb-4 border-b border-brand-gray relative">
                <div className="flex flex-col gap-1 text-left">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-zinc-500">Sequence active</span>
                    <h2 className="text-xl font-serif text-white tracking-widest">ANALYSIS PROTOCOL</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-brand-red rounded-sm animate-pulse shadow-[0_0_10px_rgba(210,18,46,0.8)]" />
                    <span className="text-sm font-mono text-brand-red font-bold">
                        {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Vertical Stepper */}
            <div className="w-full mb-16 space-y-8 relative">
                {/* Master line */}
                <div className="absolute top-4 left-[23px] w-px h-[calc(100%-2rem)] bg-zinc-900 z-0" />

                {STEPS.map((stepName, i) => {
                    const agentNum = i + 1;
                    const isComplete = completedAgents.has(agentNum);
                    const isActive = currentAgent === agentNum;

                    return (
                        <div key={agentNum} className="relative z-10 flex items-center gap-6 group">
                            {/* Terminal indicator box */}
                            <div
                                className={`w-12 h-12 flex items-center justify-center border transition-colors duration-500 bg-brand-black ${isComplete
                                    ? 'border-zinc-700 text-zinc-500'
                                    : isActive
                                        ? 'border-brand-red text-brand-red shadow-[0_0_15px_rgba(210,18,46,0.2)]'
                                        : 'border-zinc-900 text-zinc-800'
                                    }`}
                            >
                                {isComplete ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : isActive ? (
                                    <span className="text-xs font-mono font-bold animate-pulse">0{agentNum}</span>
                                ) : (
                                    <span className="text-xs font-mono">0{agentNum}</span>
                                )}
                            </div>

                            {/* Text & Timing */}
                            <div className="flex flex-col">
                                <span
                                    className={`text-sm font-sans uppercase tracking-widest transition-colors duration-500 ${isComplete
                                        ? 'text-zinc-600'
                                        : isActive
                                            ? 'text-white font-bold'
                                            : 'text-zinc-800'
                                        }`}
                                >
                                    {stepName}
                                </span>
                                {isComplete && latencies[agentNum] && (
                                    <span className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                                        Execution time: {(latencies[agentNum] / 1000).toFixed(2)}s
                                    </span>
                                )}
                                {isActive && (
                                    <span className="text-[10px] font-mono text-brand-red mt-1 uppercase animate-pulse">
                                        Processing variables...
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Rotating Tip / Terminal Output Area */}
            <div className="w-full p-6 border border-brand-gray bg-zinc-950 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-brand-red/30 to-transparent opacity-50" />
                <p key={tipIndex} className="text-xs font-mono uppercase text-zinc-400 tracking-wider animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <span className="text-brand-red mr-3 font-bold">{'>'}</span>
                    {ROTATING_TIPS[tipIndex]}
                </p>
            </div>
        </div>
    );
}

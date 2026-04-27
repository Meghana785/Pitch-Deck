'use client';

import React, { useCallback, useState } from 'react';

interface FileUploaderProps {
    file: File | null;
    onFileSelect: (file: File | null) => void;
    disabled?: boolean;
}

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.pptx'];

export function FileUploader({ file, onFileSelect, disabled }: FileUploaderProps) {
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (selectedFile: File) => {
        setError(null);
        if (!selectedFile) return;

        if (selectedFile.size > MAX_SIZE_BYTES) {
            setError(`File exceeds the ${MAX_SIZE_MB}MB limit.`);
            return;
        }

        const isAllowedExt = ALLOWED_EXTENSIONS.some((ext) =>
            selectedFile.name.toLowerCase().endsWith(ext)
        );
        const isAllowedType = ALLOWED_TYPES.includes(selectedFile.type);

        if (!isAllowedExt && !isAllowedType) {
            setError('Please upload a valid .pdf or .pptx file.');
            return;
        }

        onFileSelect(selectedFile);
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (disabled) return;
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        },
        [disabled]
    );

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-zinc-400">Pitch Deck Upload</h3>
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`relative flex flex-col items-center justify-center w-full h-56 border border-dashed rounded-sm transition-all duration-300 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    } ${isDragging
                        ? 'border-brand-red bg-brand-red/5'
                        : file
                            ? 'border-brand-red/50 bg-brand-red/5'
                            : 'border-zinc-300 dark:border-zinc-600 hover:border-brand-red bg-zinc-50 dark:bg-zinc-900/30'
                    }`}
            >
                <input
                    type="file"
                    accept=".pdf,.pptx"
                    onChange={onChange}
                    disabled={disabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
                />

                {!file ? (
                    <div className="text-center px-6 pointer-events-none flex flex-col items-center">
                        <div className="w-12 h-12 mb-4 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-sm flex items-center justify-center transform rotate-45 transition-transform duration-500">
                            <div className="w-3 h-3 bg-zinc-300 dark:bg-zinc-500 rounded-sm transform -rotate-45 transition-colors duration-500" />
                        </div>
                        <p className="text-sm text-zinc-900 dark:text-white font-sans font-bold uppercase tracking-widest">Upload Deck</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-400 font-mono mt-2">PDF/PPTX — MAX 20MB</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 z-30">
                        <div className="w-12 h-12 border border-brand-red/30 bg-brand-red/10 text-brand-red rounded-sm flex items-center justify-center shadow-lg dark:shadow-[0_0_15px_rgba(210,18,46,0.15)]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-sm font-sans font-bold text-zinc-900 dark:text-white uppercase tracking-widest truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onFileSelect(null);
                                setError(null);
                            }}
                            disabled={disabled}
                            className="mt-3 text-[10px] uppercase font-sans font-bold tracking-widest text-zinc-400 hover:text-brand-red transition-colors border-b border-transparent hover:border-brand-red pb-0.5"
                        >
                            Remove
                        </button>
                    </div>
                )}
            </div>
            {error && <p className="text-xs font-mono text-brand-red mt-1 uppercase">[{error}]</p>}
        </div>
    );
}

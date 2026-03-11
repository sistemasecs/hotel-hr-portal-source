"use client";

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useAuth } from '@/context/AuthContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SecureDocumentViewerProps {
    fileUrl: string;
}

export default function SecureDocumentViewer({ fileUrl }: SecureDocumentViewerProps) {
    const { user } = useAuth();
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [isFocused, setIsFocused] = useState(true);

    // Prevent Print Screen and Ctrl+P / Cmd+P
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                alert('Screenshots are disabled for this document.');
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
                e.preventDefault();
                alert('Printing and saving are disabled for this document.');
            }
        };

        const handleBlur = () => setIsFocused(false);
        const handleFocus = () => setIsFocused(true);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }

    const watermarkText = `${user?.name || 'User'} - ${new Date().toISOString().split('T')[0]}`;

    return (
        <div 
            className="flex flex-col items-center relative select-none w-full"
            onContextMenu={(e) => {
                e.preventDefault();
                return false;
            }}
        >
            {/* Focus loss blur overlay to prevent snipping tools */}
            {!isFocused && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex items-center justify-center">
                    <p className="text-xl font-bold text-slate-800">
                        Content hidden. Click here to resume viewing.
                    </p>
                </div>
            )}

            <div className="flex justify-between w-full max-w-[800px] mb-4">
                <button
                    onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                    disabled={pageNumber <= 1}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded disabled:opacity-50"
                >
                    Previous
                </button>
                <p className="text-sm text-slate-600 font-medium self-center">
                    Page {pageNumber} of {numPages || '--'}
                </p>
                <button
                    onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
                    disabled={pageNumber >= (numPages || 1)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            <div className="relative shadow-2xl border border-slate-300 overflow-hidden inline-[mx-auto]">
                <Document 
                    file={fileUrl} 
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="w-full"
                    loading={
                        <div className="animate-pulse bg-slate-200 w-[800px] h-[1000px] flex items-center justify-center">
                            Loading secure document...
                        </div>
                    }
                >
                    <Page 
                        pageNumber={pageNumber} 
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={800} // Optional: scale width to fit nicely
                    />
                </Document>

                {/* repeating watermark overlay */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden flex flex-wrap justify-center items-center opacity-15">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div 
                            key={i} 
                            className="text-2xl font-bold text-slate-900 -rotate-45 m-12 whitespace-nowrap"
                        >
                            {watermarkText}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

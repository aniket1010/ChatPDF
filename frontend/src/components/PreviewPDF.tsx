"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { FiLoader, FiRefreshCw } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Import required styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '../styles/pdf-viewer.css';

import { getConversationPDF } from '@/services/api';
import { globalPDFCache } from '@/utils/pdfCache';

// Dynamically import the viewer component
const PdfViewerCore = dynamic(() => import('./PdfViewerCore'), {
  ssr: false,
});

type ViewState = 'loading' | 'rendering' | 'error' | 'idle';

const TransitionOverlay = ({ state, visible }: { state: ViewState; visible: boolean }) => {
  let message = 'Loading...';
  if (state === 'loading') message = 'Fetching PDF...';
  else if (state === 'rendering') message = 'Rendering PDF...';
  else if (state === 'error') message = 'Failed to load PDF.';

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center"
      style={{
        backgroundColor: 'white',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="flex flex-col items-center gap-2 text-black/60">
        {state !== 'error' ? <div className="animate-spin"><FiLoader size={24} /></div> : <FiRefreshCw size={24} />}
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

interface PreviewPDFProps {
  conversationId: string;
  currentPage?: number;
  onPdfLoad?: (totalPages: number) => void;
  onPageChange?: (page: number) => void;
}

export default function PreviewPDF({ conversationId, currentPage = 1, onPdfLoad, onPageChange }: PreviewPDFProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [isClient, setIsClient] = useState(false);
  
  // Debug currentPage changes
  useEffect(() => {
    console.log('PreviewPDF: currentPage changed to:', currentPage);
  }, [currentPage]);
  
  // Use a ref for the onPdfLoad prop to prevent useEffect re-runs
  const onPdfLoadRef = useRef(onPdfLoad);
  useEffect(() => {
    onPdfLoadRef.current = onPdfLoad;
  }, [onPdfLoad]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Main document loading logic
  useEffect(() => {
    if (!conversationId) {
      setViewState('idle');
      setPdfUrl(null);
      return;
    }

    const loadPdf = async () => {
      setViewState('loading');
      setPdfUrl(null);
      try {
        let url;
        if (globalPDFCache.has(conversationId)) {
          url = globalPDFCache.get(conversationId)!;
        } else {
          const res = await getConversationPDF(conversationId);
          url = URL.createObjectURL(res.data);
          globalPDFCache.set(conversationId, url);
        }
        setPdfUrl(url);
        setViewState('rendering');
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setViewState('error');
      }
    };

    loadPdf();
  }, [conversationId]);

  // ✅ Simplified: This callback's only job is to report page changes.
  const handlePageChange = useCallback((e: { currentPage: number }) => {
    const newPage = e.currentPage + 1; // Convert from 0-based to 1-based
    console.log('PreviewPDF: Page change event received:', newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  }, [onPageChange]);

  // ✅ This is now the single source of truth for when the document is ready.
  const handleDocumentLoadSuccess = useCallback((e: { doc: { numPages: number } }) => {
    console.log('PreviewPDF: Document load success:', e);
    const totalPdfPages = e.doc.numPages;
    
    // Call the parent component's callback
    if (onPdfLoadRef.current) {
      onPdfLoadRef.current(totalPdfPages);
    }
    
    // Hide the loading overlay
    setViewState('idle');
  }, []);

  // Handle the case where no conversation is selected
  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-black/40">
        <div className="text-center">
          <span className="text-lg">No conversation selected</span>
        </div>
      </div>
    );
  }

  // Add a timeout to hide overlay if PDF loads but callbacks don't fire
  useEffect(() => {
    if (viewState === 'rendering') {
      const timeout = setTimeout(() => {
        console.log('PreviewPDF: Forcing overlay to hide after timeout');
        setViewState('idle');
      }, 5000); // Hide overlay after 5 seconds if still rendering
      
      return () => clearTimeout(timeout);
    }
  }, [viewState]);

  const isOverlayVisible = viewState === 'loading' || viewState === 'rendering';

  return (
    <div className="relative h-full w-full" style={{ minHeight: '600px' }}>
      <TransitionOverlay state={viewState} visible={isOverlayVisible} />
      <div className="flex h-full w-full justify-center">
        {isClient && pdfUrl && (
          <div className="w-full" style={{ minHeight: '600px' }}>
            <PdfViewerCore
              pdfUrl={pdfUrl}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onDocumentLoadSuccess={handleDocumentLoadSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}
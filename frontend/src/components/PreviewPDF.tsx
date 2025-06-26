"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { FiChevronLeft, FiChevronRight, FiLoader, FiRefreshCw } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Import required styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '../styles/pdf-viewer.css';

import { getConversationPDF } from '@/services/api';
import { globalPDFCache } from '@/utils/pdfCache';

const PdfViewerCore = dynamic(() => import('./PdfViewerCore'), {
  ssr: false,
});

type ViewState = 'loading' | 'rendering' | 'error' | 'idle';

const TransitionOverlay = ({ state, visible }: { state: ViewState; visible: boolean }) => {
  let message = 'Loading...';
  if (state === 'loading') {
    message = 'Fetching PDF...';
  } else if (state === 'rendering') {
    message = 'Rendering PDF...';
  } else if (state === 'error') {
    message = 'Failed to load PDF.';
  }

  return (
    <div
      className="absolute inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-10"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
        {state !== 'error' ? (
          <div className="animate-spin">
            <FiLoader size={24} />
          </div>
        ) : (
          <FiRefreshCw size={24} />
        )}
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

export default function PreviewPDF({ conversationId }: { conversationId: string | null }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('idle');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Document Loading Logic
  useEffect(() => {
    if (!conversationId) {
      setViewState('idle');
      setPdfUrl(null);
      return;
    }
    
    setViewState('loading');
    setPdfUrl(null);

    const loadPdf = async () => {
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
    
    // Short delay to allow for CSS transitions to start
    const timer = setTimeout(loadPdf, 50);
    return () => clearTimeout(timer);

  }, [conversationId]);

  const pageNavigationPluginInstance = pageNavigationPlugin();
  
  const handlePageChange = useCallback((e: any) => { 
    setTotalPages(e.doc.numPages);
    setCurrentPage(e.currentPage + 1);
    setViewState('idle');
  }, []);
  
  const { jumpToPage } = pageNavigationPluginInstance;
  const goToNextPage = useCallback(() => { if (currentPage < totalPages) jumpToPage(currentPage); }, [currentPage, totalPages, jumpToPage]);
  const goToPreviousPage = useCallback(() => { if (currentPage > 1) jumpToPage(currentPage - 2); }, [currentPage, jumpToPage]);
  const goToPage = useCallback((page: number) => { if (page >= 1 && page <= totalPages) jumpToPage(page - 1); }, [totalPages, jumpToPage]);
  
  const handleMouseMove = useCallback(() => { setShowControls(true); }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);
  
  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 p-6">
        <div className="text-center">
          <span className="text-lg">No conversation selected</span>
        </div>
      </div>
    );
  }

  const isOverlayVisible = viewState === 'loading' || viewState === 'rendering';

  return (
    <div 
      className="w-full h-full relative bg-gray-100 dark:bg-gray-900"
      onMouseMove={handleMouseMove}
    >
      <TransitionOverlay state={viewState} visible={isOverlayVisible} />

      <div className="w-full h-full" style={{ opacity: viewState === 'idle' ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        {isClient && pdfUrl && (
          <PdfViewerCore
            pdfUrl={pdfUrl}
            pageNavigationPluginInstance={pageNavigationPluginInstance}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {totalPages > 1 && viewState === 'idle' && (
        <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${ showControls ? 'opacity-100' : 'opacity-0' }`}>
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 text-white shadow-lg border border-white/10">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="p-2 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-2 text-sm font-medium">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (!isNaN(page)) {
                    goToPage(page);
                  }
                }}
                className="w-10 bg-transparent text-center border-none outline-none text-white text-sm font-medium pdf-nav-input"
                min={1}
                max={totalPages}
              />
              <span className="text-zinc-300 text-xs">/ {totalPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              aria-label="Next page"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
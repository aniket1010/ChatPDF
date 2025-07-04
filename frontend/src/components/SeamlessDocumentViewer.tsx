'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import PreviewPDF from './PreviewPDF';

interface SeamlessDocumentViewerProps {
  conversationId: string;
  pdfTitle?: string;
}

export default function SeamlessDocumentViewer({ conversationId, pdfTitle }: SeamlessDocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPdfPages, setTotalPdfPages] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [mouseInside, setMouseInside] = useState(false);

  // Handle mouse enter/leave for the component
  const handleMouseEnter = useCallback(() => {
    setMouseInside(true);
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouseInside(false);
    setShowControls(false);
  }, []);

  // Handle mouse movement within component to keep controls visible
  const handleMouseMove = useCallback(() => {
    if (mouseInside) {
      setShowControls(true);
    }
  }, [mouseInside]);

  // Simple navigation functions
  const goToPreviousPage = useCallback(() => {
    console.log('SeamlessDocumentViewer: goToPreviousPage called, currentPage:', currentPage);
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      console.log('SeamlessDocumentViewer: Setting currentPage to:', newPage);
      setCurrentPage(newPage);
    }
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    console.log('SeamlessDocumentViewer: goToNextPage called, currentPage:', currentPage, 'totalPdfPages:', totalPdfPages);
    if (currentPage < totalPdfPages) {
      const newPage = currentPage + 1;
      console.log('SeamlessDocumentViewer: Setting currentPage to:', newPage);
      setCurrentPage(newPage);
    }
  }, [currentPage, totalPdfPages]);

  const handlePageInput = useCallback((page: number) => {
    console.log('SeamlessDocumentViewer: handlePageInput called with page:', page);
    if (page >= 1 && page <= totalPdfPages) {
      console.log('SeamlessDocumentViewer: Setting currentPage to:', page);
      setCurrentPage(page);
    }
  }, [totalPdfPages]);

  // Calculate total pages
  const displayTotalPages = totalPdfPages;

  return (
    <div 
      className="relative w-full h-full" 
      style={{ backgroundColor: '#F9F4EB' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >

      {/* PDF Container */}
      <div className="w-full h-full overflow-y-auto">
        <PreviewPDF 
          conversationId={conversationId}
          currentPage={currentPage}
          onPdfLoad={(totalPages) => {
            setTotalPdfPages(totalPages);
            console.log('SeamlessDocumentViewer: PDF loaded with', totalPages, 'pages');
          }}
          onPageChange={(page) => {
            // Only update if the page actually changed to avoid loops
            if (page !== currentPage) {
              console.log('SeamlessDocumentViewer: Page changed from', currentPage, 'to', page);
              setCurrentPage(page);
            }
          }}
        />
      </div>

      {/* Navigation Controls - Positioned relative to component */}
      {showControls && (
        <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 text-white shadow-lg border border-white/10">
            {/* Previous Button */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
            </button>

            {/* Page Input */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value, 10);
                  if (!isNaN(page)) {
                    handlePageInput(page);
                  }
                }}
                className="w-12 bg-white/10 text-center border border-white/20 rounded outline-none text-white text-sm font-medium px-1 py-1"
                min={1}
                max={totalPdfPages}
              />
              <span className="text-white/70 text-sm">/ {displayTotalPages}</span>
            </div>

            {/* Next Button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPdfPages}
              className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
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
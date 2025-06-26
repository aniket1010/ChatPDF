'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PDFSummaryPage from './PDFSummaryPage';
import PreviewPDF from './PreviewPDF';

interface ProfessionalPdfViewerProps {
  conversationId: string;
  pdfTitle?: string;
}

export default function ProfessionalPdfViewer({ conversationId, pdfTitle }: ProfessionalPdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(0); // 0 = Summary, 1+ = PDF pages
  const [totalPages, setTotalPages] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Simulate PDF loading for now
  useEffect(() => {
    const timer = setTimeout(() => {
      setTotalPages(24); // Default for demo
    }, 1000);
    return () => clearTimeout(timer);
  }, [conversationId]);

  return (
    <div 
      className="relative w-full h-full bg-gray-100"
      onMouseMove={handleMouseMove}
    >
      {/* Page Navigation Controls - Center Only */}
      <div 
        className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1.5 rounded">
            <span className="text-sm font-medium">
              {currentPage === 0 ? '1' : currentPage + 1}
            </span>
            <span className="text-sm text-gray-300">/</span>
            <span className="text-sm text-gray-300">{totalPages + 1}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Seamless Scrolling Content */}
      <div className="w-full h-full overflow-y-auto bg-white">
        {/* Summary Section - Always at top */}
        <div className="w-full">
          <PDFSummaryPage
            conversationId={conversationId}
            onNavigateToPage={setCurrentPage}
          />
        </div>
        
        {/* PDF Content - Continues seamlessly below */}
        <div className="w-full">
          <PreviewPDF conversationId={conversationId} />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-t border-gray-200 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-center px-4 py-2 text-sm text-gray-600">
          <div>
            {pdfTitle ? pdfTitle.replace('.pdf', '') : 'Document'} - Page {currentPage === 0 ? '1' : currentPage + 1} of {totalPages + 1}
          </div>
        </div>
      </div>
    </div>
  );
} 
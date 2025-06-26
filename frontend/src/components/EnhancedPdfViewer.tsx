'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, BookOpen } from 'lucide-react';
import PDFSummaryPage from './PDFSummaryPage';
import PreviewPDF from './PreviewPDF';

interface EnhancedPdfViewerProps {
  conversationId: string;
}

export default function EnhancedPdfViewer({ conversationId }: EnhancedPdfViewerProps) {
  const [currentPage, setCurrentPage] = useState(0); // 0 = Summary, 1+ = PDF pages
  const [totalPages, setTotalPages] = useState(0);
  const [pdfLoaded, setPdfLoaded] = useState(false);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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

  // For now, we'll set a default total pages since PreviewPDF doesn't expose this
  useEffect(() => {
    // Simulate PDF loading - in a real implementation, PreviewPDF would need to expose page count
    const timer = setTimeout(() => {
      setTotalPages(10); // Default assumption - this should be dynamic in production
      setPdfLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [conversationId]);

  const getPageLabel = () => {
    if (currentPage === 0) return 'Overview';
    return `Page ${currentPage} of ${totalPages}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg min-w-[120px] justify-center">
              <FileText size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {getPageLabel()}
              </span>
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={!pdfLoaded || currentPage >= totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-sm text-gray-600">
          {currentPage === 0 ? 'Document Overview' : 'Document Content'}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {currentPage === 0 ? (
          <PDFSummaryPage
            conversationId={conversationId}
            onNavigateToPage={handlePageChange}
          />
        ) : (
          <div className="h-full">
            <PreviewPDF conversationId={conversationId} />
          </div>
        )}
      </div>

      {/* Footer with Page Info */}
      {pdfLoaded && (
        <div className="px-4 py-2 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Total Pages: {totalPages + 1}</span>
              <span>•</span>
              <span>Current: {getPageLabel()}</span>
            </div>
            
            {/* Jump to Page */}
            <div className="flex items-center gap-2">
              <span>Go to:</span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Overview</option>
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Page {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
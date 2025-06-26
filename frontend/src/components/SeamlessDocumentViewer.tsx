'use client';

import React, { useState, useEffect, useRef } from 'react';
import PDFSummaryPage from './PDFSummaryPage';
import PreviewPDF from './PreviewPDF';

interface SeamlessDocumentViewerProps {
  conversationId: string;
  pdfTitle?: string;
}

export default function SeamlessDocumentViewer({ conversationId, pdfTitle }: SeamlessDocumentViewerProps) {
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Show controls on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);
    const timer = setTimeout(() => setShowControls(false), 2000);
    return () => clearTimeout(timer);
  };

  // Track scroll position
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollPosition(containerRef.current.scrollTop);
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-gray-50"
      onMouseMove={handleMouseMove}
    >
      {/* Seamless Scrolling Container */}
      <div 
        ref={containerRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden"
        onScroll={handleScroll}
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Summary Section - Page 0 */}
        <div className="w-full bg-white border-b border-gray-200">
          <PDFSummaryPage
            conversationId={conversationId}
            onNavigateToPage={() => {}} // No page navigation needed
          />
        </div>
        
        {/* PDF Content Section - Continues seamlessly */}
        <div className="w-full bg-white">
          <PreviewPDF conversationId={conversationId} />
        </div>
      </div>

      {/* Floating Page Indicator */}
      <div 
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
          {scrollPosition < 100 ? 'Summary' : 'Document'}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-200 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-center px-4 py-2 text-sm text-gray-600">
          {pdfTitle ? pdfTitle.replace('.pdf', '') : 'Document'}
        </div>
      </div>
    </div>
  );
} 
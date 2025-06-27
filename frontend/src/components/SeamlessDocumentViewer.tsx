'use client';

import React, { useState } from 'react';
import PDFSummaryPage from './PDFSummaryPage';
import PreviewPDF from './PreviewPDF';

interface SeamlessDocumentViewerProps {
  conversationId: string;
  pdfTitle?: string;
}

export default function SeamlessDocumentViewer({ conversationId, pdfTitle }: SeamlessDocumentViewerProps) {
  const [currentView, setCurrentView] = useState<'summary' | 'document'>('summary');

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: '#F9F4EB' }}>
      {/* Summary View */}
      {currentView === 'summary' && (
        <div className="w-full h-full overflow-y-auto">
          <PDFSummaryPage conversationId={conversationId} />
          
          {/* Navigate to Document Button */}
          <div className="fixed bottom-6 right-6 z-50">
            <button
              onClick={() => setCurrentView('document')}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 shadow-lg flex items-center gap-2"
            >
              Document
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Document View */}
      {currentView === 'document' && (
        <div className="w-full h-full">
          <PreviewPDF conversationId={conversationId} />
          
          {/* Navigate to Summary Button */}
          <div className="fixed bottom-6 left-6 z-50">
            <button
              onClick={() => setCurrentView('summary')}
              className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 shadow-lg flex items-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 
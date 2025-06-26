'use client';

import React, { useState, useEffect } from 'react';
import PDFSummaryPage from './PDFSummaryPage';
import PreviewPDF from './PreviewPDF';

interface SeamlessPdfViewerProps {
  conversationId: string;
}

export default function SeamlessPdfViewer({ conversationId }: SeamlessPdfViewerProps) {
  return (
    <div className="h-full bg-gray-100 overflow-y-auto">
      {/* Summary Section - Always at top */}
      <div className="bg-white shadow-sm">
        <PDFSummaryPage
          conversationId={conversationId}
          onNavigateToPage={() => {}} // No navigation needed in seamless mode
        />
      </div>
      
      {/* Separator */}
      <div className="bg-gray-200 h-2"></div>
      
      {/* PDF Content - Continues below */}
      <div className="bg-white min-h-screen">
        <PreviewPDF conversationId={conversationId} />
      </div>
    </div>
  );
} 
'use client';

import React from 'react';

// 1. Import components and hooks directly
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';

// 2. Import the required CSS
import '@react-pdf-viewer/core/lib/styles/index.css';

interface PdfViewerCoreProps {
  pdfUrl: string;
  currentPage?: number;
  onPageChange: (e: { currentPage: number }) => void;
  onDocumentLoadSuccess?: (e: any) => void;
}

const PdfViewerCore: React.FC<PdfViewerCoreProps> = ({
  pdfUrl,
  currentPage = 1,
  onPageChange,
  onDocumentLoadSuccess,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = React.useState(0);
  const [pageHeights, setPageHeights] = React.useState<number[]>([]);
  
  // Debug document load
  const handleDocumentLoad = (e: any) => {
    console.log('PdfViewerCore: Document load event triggered:', e);
    if (e.doc && e.doc.numPages) {
      setTotalPages(e.doc.numPages);
      console.log('PdfViewerCore: Total pages:', e.doc.numPages);
      
      // Calculate page heights after a delay
      setTimeout(() => {
        calculatePageHeights();
      }, 2000);
    }
    if (onDocumentLoadSuccess) {
      onDocumentLoadSuccess(e);
    }
  };

  // Handle page changes from scrolling
  const handlePageChange = (e: { currentPage: number }) => {
    const newPage = e.currentPage + 1; // Convert from 0-based to 1-based
    console.log('PdfViewerCore: Page changed to:', newPage);
    if (onPageChange) {
      onPageChange(e);
    }
  };

  // Calculate the height of each page
  const calculatePageHeights = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Try multiple selectors to find page elements
    let pageElements = container.querySelectorAll('[data-testid="core__page-layer"]');
    if (pageElements.length === 0) {
      pageElements = container.querySelectorAll('[class*="page-layer"]');
    }
    if (pageElements.length === 0) {
      pageElements = container.querySelectorAll('[class*="page"]');
    }
    if (pageElements.length === 0) {
      // Try finding any div that might be a page
      pageElements = container.querySelectorAll('div[style*="height"]');
    }
    
    console.log('PdfViewerCore: Found', pageElements.length, 'page elements');
    
    if (pageElements.length === 0) {
      console.log('PdfViewerCore: No page elements found, retrying in 1 second...');
      setTimeout(calculatePageHeights, 1000);
      return;
    }
    
    const heights: number[] = [];
    let cumulativeHeight = 0;
    
    pageElements.forEach((pageElement, index) => {
      const rect = pageElement.getBoundingClientRect();
      const height = rect.height;
      heights.push(cumulativeHeight);
      cumulativeHeight += height;
      console.log(`PdfViewerCore: Page ${index + 1} starts at height ${cumulativeHeight}, height: ${height}`);
    });
    
    setPageHeights(heights);
    console.log('PdfViewerCore: Page heights calculated:', heights);
  };

  // Scroll to specific page
  const scrollToPage = React.useCallback((pageNumber: number) => {
    console.log('PdfViewerCore: Attempting to scroll to page:', pageNumber);
    
    if (pageHeights.length === 0) {
      console.log('PdfViewerCore: Page heights not calculated yet, retrying...');
      // Retry after a short delay
      setTimeout(() => scrollToPage(pageNumber), 500);
      return;
    }
    
    if (pageNumber < 1 || pageNumber > pageHeights.length) {
      console.log('PdfViewerCore: Invalid page number:', pageNumber, 'available pages:', pageHeights.length);
      return;
    }
    
    const targetHeight = pageHeights[pageNumber - 1];
    console.log('PdfViewerCore: Scrolling to height:', targetHeight, 'for page:', pageNumber);
    
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: targetHeight,
        behavior: 'smooth'
      });
      
      // Verify the scroll worked
      setTimeout(() => {
        const currentScrollTop = containerRef.current?.scrollTop || 0;
        console.log('PdfViewerCore: Current scroll position:', currentScrollTop, 'target was:', targetHeight);
      }, 500);
    }
  }, [pageHeights]);

  // React to currentPage prop changes
  React.useEffect(() => {
    console.log('PdfViewerCore: currentPage changed to:', currentPage);
    
    // Method 1: Try using calculated page heights
    if (pageHeights.length > 0) {
      scrollToPage(currentPage);
    } else {
      // Method 2: Fallback - try to find page elements directly
      setTimeout(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        let pageElements = container.querySelectorAll('[data-testid="core__page-layer"]');
        if (pageElements.length === 0) {
          pageElements = container.querySelectorAll('[class*="page-layer"]');
        }
        if (pageElements.length === 0) {
          pageElements = container.querySelectorAll('[class*="page"]');
        }
        
        console.log('PdfViewerCore: Fallback - found', pageElements.length, 'page elements');
        
        if (pageElements.length > 0 && pageElements[currentPage - 1]) {
          console.log('PdfViewerCore: Using fallback scroll to page element');
          pageElements[currentPage - 1].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    }
  }, [currentPage, scrollToPage, pageHeights]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto">
      {/* @ts-ignore */}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        {/* @ts-ignore */}
        <Viewer
          fileUrl={pdfUrl}
          onPageChange={handlePageChange}
          onDocumentLoad={handleDocumentLoad}
          defaultScale={SpecialZoomLevel.PageWidth}
          initialPage={0}
        />
      </Worker>
    </div>
  );
};

export default PdfViewerCore;
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
  isNavigationAction?: boolean;
}

const PdfViewerCore: React.FC<PdfViewerCoreProps> = ({
  pdfUrl,
  currentPage = 1,
  onPageChange,
  onDocumentLoadSuccess,
  isNavigationAction = false,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = React.useState(0);
  const [pageHeights, setPageHeights] = React.useState<number[]>([]);
  const lastScrollPositionRef = React.useRef<number>(0);
  const preserveScrollRef = React.useRef<boolean>(false);
  const lastContainerWidthRef = React.useRef<number>(0);
  
  // Debug document load
  const handleDocumentLoad = (e: any) => {
    console.log('PdfViewerCore: Document load event triggered:', e);
    if (e.doc && e.doc.numPages) {
      setTotalPages(e.doc.numPages);
      console.log('PdfViewerCore: Total pages:', e.doc.numPages);
      
      // Calculate page heights after multiple delays to ensure PDF is fully rendered
      setTimeout(() => {
        calculatePageHeights();
      }, 1000);
      setTimeout(() => {
        calculatePageHeights();
      }, 3000);
      setTimeout(() => {
        calculatePageHeights();
      }, 5000);
    }
    if (onDocumentLoadSuccess) {
      onDocumentLoadSuccess(e);
    }
  };



  // Calculate the height of each page
  const calculatePageHeights = () => {
    if (!containerRef.current || preserveScrollRef.current) return;
    
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
    console.log('PdfViewerCore: Page elements:', Array.from(pageElements).map(el => el.className));
    
    if (pageElements.length === 0) {
      console.log('PdfViewerCore: No page elements found, retrying in 1 second...');
      setTimeout(calculatePageHeights, 1000);
      return;
    }
    
    const heights: number[] = [];
    
    pageElements.forEach((pageElement, index) => {
      const rect = pageElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top + container.scrollTop;
      const height = rect.height;
      
      // Ensure first page starts at 0
      const adjustedTop = index === 0 ? 0 : relativeTop;
      heights.push(adjustedTop);
      console.log(`PdfViewerCore: Page ${index + 1} starts at relative position ${adjustedTop}, height: ${height}`);
    });
    
    setPageHeights(heights);
    console.log('PdfViewerCore: Page heights calculated:', heights);
    
    // Trigger initial page detection after heights are calculated
    setTimeout(() => detectCurrentPage(), 200);
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
        behavior: 'auto'
      });
      
      // Verify the scroll worked
      setTimeout(() => {
        const currentScrollTop = containerRef.current?.scrollTop || 0;
        console.log('PdfViewerCore: Current scroll position:', currentScrollTop, 'target was:', targetHeight);
      }, 100);
    }
  }, [pageHeights]);

  // Manual page detection based on scroll position
  const detectCurrentPage = React.useCallback(() => {
    if (!containerRef.current || preserveScrollRef.current) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    console.log('PdfViewerCore: detectCurrentPage called - scrollTop:', scrollTop, 'currentPage:', currentPage);
    
    // EMERGENCY PAGE 1 DETECTION: If scroll is very close to top, force page 1
    if (scrollTop <= 100) {
      console.log('PdfViewerCore: EMERGENCY PAGE 1 DETECTION - scrollTop:', scrollTop);
      if (currentPage !== 1 && onPageChange) {
        console.log('PdfViewerCore: EMERGENCY - Forcing page 1');
        onPageChange({ currentPage: 1 });
        return;
      }
    }
    
    // Try method 1: Use calculated page heights if available
    if (pageHeights.length > 0) {
      let detectedPage = 1;
      
             // More robust page detection algorithm
       // Check which page contains the top 25% of the viewport
       const detectionPoint = scrollTop + containerHeight * 0.25;
       
       // Much more aggressive page 1 detection
       if (scrollTop <= 50) {
         detectedPage = 1;
         console.log('PdfViewerCore: Near top of document (scrollTop <= 50) - forcing page 1');
       } else {
         // Find the page that contains our detection point
         for (let i = 0; i < pageHeights.length; i++) {
           const currentPageStart = pageHeights[i];
           const nextPageStart = i + 1 < pageHeights.length ? pageHeights[i + 1] : Infinity;
           
           console.log(`PdfViewerCore: Checking page ${i + 1}: range [${currentPageStart}, ${nextPageStart}), detectionPoint: ${detectionPoint}`);
           
           // If detection point is between current page start and next page start
           if (detectionPoint >= currentPageStart && detectionPoint < nextPageStart) {
             detectedPage = i + 1;
             console.log(`PdfViewerCore: Detection point ${detectionPoint} falls in page ${i + 1} range [${currentPageStart}, ${nextPageStart})`);
             break;
           }
         }
       }
      
      console.log('PdfViewerCore: Manual page detection (method 1) - scrollTop:', scrollTop, 'containerHeight:', containerHeight, 'detectionPoint:', detectionPoint, 'detectedPage:', detectedPage, 'currentPage:', currentPage);
      console.log('PdfViewerCore: Page heights for reference:', pageHeights);
      
      // Only report page change if it's different from current
      if (detectedPage !== currentPage && onPageChange) {
        console.log('PdfViewerCore: Manual page detection - page changed to:', detectedPage, 'calling onPageChange');
        onPageChange({ currentPage: detectedPage }); // Use 1-based indexing consistently
        console.log('PdfViewerCore: onPageChange called with:', { currentPage: detectedPage });
      } else {
        console.log('PdfViewerCore: No page change needed - detectedPage:', detectedPage, 'currentPage:', currentPage);
      }
      return;
    }
    
    // Method 2: Fallback - use visible page elements
    let pageElements = container.querySelectorAll('[data-testid="core__page-layer"]');
    if (pageElements.length === 0) {
      pageElements = container.querySelectorAll('[class*="page-layer"]');
    }
    if (pageElements.length === 0) {
      pageElements = container.querySelectorAll('[class*="page"]');
    }
    
    if (pageElements.length > 0) {
      const containerRect = container.getBoundingClientRect();
      const detectionPoint = scrollTop + containerHeight * 0.25;
      
      let detectedPage = 1;
      
      // Special handling for very top of document
      if (scrollTop <= 50) {
        detectedPage = 1;
        console.log('PdfViewerCore: Near top of document (fallback, scrollTop <= 50) - forcing page 1');
      } else {
        // Check which page element contains our detection point
        pageElements.forEach((pageElement, index) => {
          const rect = pageElement.getBoundingClientRect();
          const containerTop = containerRect.top;
          const pageTop = rect.top - containerTop + scrollTop;
          const pageBottom = rect.bottom - containerTop + scrollTop;
          
          console.log(`PdfViewerCore: Fallback checking page ${index + 1}: range [${pageTop}, ${pageBottom}), detectionPoint: ${detectionPoint}`);
          
          // If detection point is within this page's bounds
          if (detectionPoint >= pageTop && detectionPoint < pageBottom) {
            detectedPage = index + 1;
            console.log(`PdfViewerCore: Fallback detection point ${detectionPoint} falls in page ${index + 1} range [${pageTop}, ${pageBottom})`);
          }
        });
      }
      
      console.log('PdfViewerCore: Manual page detection (method 2) - scrollTop:', scrollTop, 'detectionPoint:', detectionPoint, 'detectedPage:', detectedPage, 'currentPage:', currentPage);
      
      // Only report page change if it's different from current
      if (detectedPage !== currentPage && onPageChange) {
        console.log('PdfViewerCore: Manual page detection (fallback) - page changed to:', detectedPage, 'calling onPageChange');
        onPageChange({ currentPage: detectedPage });
        console.log('PdfViewerCore: onPageChange (fallback) called with:', { currentPage: detectedPage });
      } else {
        console.log('PdfViewerCore: No page change needed (fallback) - detectedPage:', detectedPage, 'currentPage:', currentPage);
      }
    }
  }, [pageHeights, currentPage, onPageChange]);

  // Save scroll position and handle container width changes
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      if (!preserveScrollRef.current) {
        lastScrollPositionRef.current = container.scrollTop;
        
        // Immediate detection for top of document to avoid delays
        if (container.scrollTop <= 50) {
          console.log('PdfViewerCore: Immediate page 1 detection triggered');
          detectCurrentPage();
        }
        
        // Throttle page detection to avoid excessive calls
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          detectCurrentPage();
        }, 50); // Reduced from 100ms to 50ms for better responsiveness
      }
    };

    const checkForWidthChange = () => {
      const currentWidth = container.clientWidth;
      if (lastContainerWidthRef.current > 0 && lastContainerWidthRef.current !== currentWidth) {
        // Width changed, preserve scroll position
        preserveScrollRef.current = true;
        const savedPosition = lastScrollPositionRef.current;
        
        setTimeout(() => {
          if (container && savedPosition > 0) {
            container.scrollTop = savedPosition;
          }
          setTimeout(() => {
            preserveScrollRef.current = false;
          }, 200);
        }, 50);
      }
      lastContainerWidthRef.current = currentWidth;
    };

    // Initial width
    lastContainerWidthRef.current = container.clientWidth;

    // Use MutationObserver to detect layout changes more reliably
    const observer = new MutationObserver(() => {
      checkForWidthChange();
    });

    // Use ResizeObserver as backup
    const resizeObserver = new ResizeObserver(() => {
      checkForWidthChange();
    });

    container.addEventListener('scroll', handleScroll);
    observer.observe(container, { attributes: true, childList: true, subtree: true });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      resizeObserver.disconnect();
      clearTimeout(scrollTimeout);
    };
  }, [detectCurrentPage]); // Add detectCurrentPage to dependencies

  // React to currentPage prop changes - ONLY for navigation button clicks
  React.useEffect(() => {
    console.log('PdfViewerCore: currentPage changed to:', currentPage, 'isNavigationAction:', isNavigationAction);
    
    // Only scroll if this is an intentional page change from navigation buttons
    if (preserveScrollRef.current || !isNavigationAction) {
      return;
    }
    
    const container = containerRef.current;
    if (!container) return;
    
    // Method 1: Try using calculated page heights for navigation buttons only
    if (pageHeights.length > 0) {
      scrollToPage(currentPage);
    } else {
      // Method 2: Fallback - try to find page elements directly for navigation buttons only
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
            behavior: 'auto',
            block: 'start'
          });
        }
      }, 100);
    }
    
  }, [currentPage, scrollToPage, pageHeights, isNavigationAction]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-y-auto"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollPaddingTop: '20px'
      }}
    >
      {/* @ts-ignore */}
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        {/* @ts-ignore */}
        <Viewer
          fileUrl={pdfUrl}
          onDocumentLoad={handleDocumentLoad}
          defaultScale={SpecialZoomLevel.PageWidth}
          initialPage={0}
        />
      </Worker>
    </div>
  );
};

export default PdfViewerCore;
'use client';

import React from 'react';

interface PdfViewerCoreProps {
  pdfUrl: string;
  pageNavigationPluginInstance: any;
  onPageChange: (e: any) => void;
}

const PdfViewerCore: React.FC<PdfViewerCoreProps> = ({ pdfUrl, pageNavigationPluginInstance, onPageChange }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [ViewerComponent, setViewerComponent] = React.useState<any>(null);
  const [WorkerComponent, setWorkerComponent] = React.useState<any>(null);
  const [SpecialZoomLevel, setSpecialZoomLevel] = React.useState<any>(null);

  React.useEffect(() => {
    const loadComponents = async () => {
      try {
        const { Viewer, Worker, SpecialZoomLevel: ZoomLevel } = await import('@react-pdf-viewer/core');
        setViewerComponent(() => Viewer);
        setWorkerComponent(() => Worker);
        setSpecialZoomLevel(ZoomLevel);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load PDF viewer components:', error);
      }
    };

    loadComponents();
  }, []);

  if (!isLoaded || !ViewerComponent || !WorkerComponent || !SpecialZoomLevel) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F9F4EB' }}>
        <div className="text-gray-500">Loading PDF viewer...</div>
      </div>
    );
  }

  return React.createElement(
    WorkerComponent,
    { workerUrl: "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js" },
    React.createElement(ViewerComponent, {
      fileUrl: pdfUrl,
      plugins: [pageNavigationPluginInstance],
      onPageChange: onPageChange,
      defaultScale: SpecialZoomLevel.PageWidth,
    })
  );
};

export default PdfViewerCore; 
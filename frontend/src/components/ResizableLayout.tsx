'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface ResizableLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  initialLeftWidth?: number; // percentage (0-100)
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
}

export default function ResizableLayout({
  leftPanel,
  rightPanel,
  initialLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
}: ResizableLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      
      // Calculate new left width as percentage
      const newLeftWidth = (mouseX / containerWidth) * 100;
      
      // Clamp the width between min and max
      const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
      
      setLeftWidth(clampedWidth);
    },
    [isDragging, minLeftWidth, maxLeftWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const rightWidth = 100 - leftWidth;

  return (
    <div 
      ref={containerRef}
      className="flex h-full w-full relative"
      style={{ userSelect: isDragging ? 'none' : 'auto' }}
    >
      {/* Left Panel */}
      <div 
        className="h-full overflow-hidden"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Draggable Divider */}
      <div
        className={`
          relative w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize transition-colors duration-200
          ${isDragging ? 'bg-blue-500' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
          <div className="w-1 h-8 bg-gray-400 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200" />
        </div>
        
        {/* Hover area for easier grabbing */}
        <div className="absolute inset-y-0 -left-2 -right-2" />
      </div>

      {/* Right Panel */}
      <div 
        className="h-full overflow-hidden"
        style={{ width: `${rightWidth}%` }}
      >
        {rightPanel}
      </div>

      {/* Overlay during dragging to prevent iframe/content interference */}
      {isDragging && (
        <div className="absolute inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
} 
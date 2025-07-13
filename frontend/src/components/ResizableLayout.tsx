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
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(0);
  const lastCalculatedWidth = useRef<number>(0);

  // Optimized mouse handlers with RAF for 60fps smoothness
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftWidth;
    
    setIsDragging(true);
    
    // Add visual feedback immediately
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    // Disable transitions during drag for smoothness
    if (leftPanelRef.current) {
      leftPanelRef.current.style.transition = 'none';
    }
    if (rightPanelRef.current) {
      rightPanelRef.current.style.transition = 'none';
    }
  }, [leftWidth]);

  const updatePanelSizes = useCallback((clientX: number) => {
    if (!containerRef.current) return leftWidth;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // Calculate drag delta
    const dragDelta = clientX - dragStartX.current;
    const dragDeltaPercentage = (dragDelta / containerWidth) * 100;
    
    // Calculate new width
    const newWidth = dragStartWidth.current + dragDeltaPercentage;
    
    // Clamp the width
    const clampedWidth = Math.min(Math.max(newWidth, minLeftWidth), maxLeftWidth);
    
    // Apply changes immediately using CSS custom properties for better performance
    container.style.setProperty('--left-width', `${clampedWidth}%`);
    container.style.setProperty('--divider-pos', `${clampedWidth}%`);
    
    // Save the last calculated width
    lastCalculatedWidth.current = clampedWidth;
    
    return clampedWidth;
  }, [minLeftWidth, maxLeftWidth, leftWidth]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Schedule update on next frame for smooth 60fps
      animationFrameRef.current = requestAnimationFrame(() => {
        updatePanelSizes(e.clientX);
      });
    },
    [isDragging, updatePanelSizes]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Use the last calculated width from the drag operation
    setLeftWidth(lastCalculatedWidth.current || leftWidth);
    
    setIsDragging(false);
    
    // Restore cursor and selection
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Re-enable transitions
    if (leftPanelRef.current) {
      leftPanelRef.current.style.transition = '';
    }
    if (rightPanelRef.current) {
      rightPanelRef.current.style.transition = '';
    }
    
    // Clear CSS variables and let React state take over
    if (containerRef.current) {
      containerRef.current.style.removeProperty('--left-width');
      containerRef.current.style.removeProperty('--divider-pos');
    }
  }, [isDragging, updatePanelSizes]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Clean up animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="h-full w-full relative"
      style={{ 
        userSelect: isDragging ? 'none' : 'auto',
        overflow: 'hidden',
        contain: 'layout style',
      } as React.CSSProperties}
    >
      {/* Left Panel Container */}
      <div 
        ref={leftPanelRef}
        className="absolute top-0 left-0 h-full"
        style={{ 
          width: isDragging ? 'var(--left-width)' : `${leftWidth}%`,
          overflow: 'hidden',
          contain: 'layout style paint',
          willChange: isDragging ? 'width' : 'auto',
          transition: isDragging ? 'none' : 'width 0.0s', // Instant for no jitter
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
        }}
      >
        <div 
          className="h-full w-full"
          style={{
            contain: 'layout style paint size',
            isolation: 'isolate',
          }}
        >
          {leftPanel}
        </div>
      </div>

      {/* Right Panel Container */}
      <div 
        ref={rightPanelRef}
        className="absolute top-0 h-full"
        style={{ 
          left: isDragging ? 'var(--left-width)' : `${leftWidth}%`,
          right: '0px',
          overflow: 'hidden',
          contain: 'layout style paint',
          willChange: isDragging ? 'left' : 'auto',
          transition: isDragging ? 'none' : 'left 0.0s', // Instant for no jitter
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
        }}
      >
        <div 
          className="h-full w-full"
          style={{
            contain: 'layout style paint size',
            isolation: 'isolate',
          }}
        >
          {rightPanel}
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        className="absolute top-0 h-full cursor-col-resize z-30"
        style={{
          left: isDragging ? 'var(--divider-pos)' : `${leftWidth}%`,
          width: '8px',
          transform: 'translate3d(-4px, 0, 0)', // Center the divider
          transition: isDragging ? 'none' : 'left 0.0s', // Instant for no jitter
          willChange: isDragging ? 'left' : 'auto',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Visual divider line */}
        <div 
          className="absolute left-1/2 top-0 h-full w-px"
          style={{
            backgroundColor: isDragging ? '#3b82f6' : '#d1d5db',
            transform: `translate3d(-50%, 0, 0) ${isDragging ? 'scaleX(2)' : 'scaleX(1)'}`,
            transition: isDragging ? 'none' : 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: isDragging ? 'transform, background-color' : 'auto',
          }}
        />
        
        {/* Hover state indicator */}
        <div 
          className="absolute left-1/2 top-1/2 w-1 h-8 bg-gray-400 rounded-full opacity-0 hover:opacity-100"
          style={{
            transform: 'translate3d(-50%, -50%, 0)',
            transition: 'opacity 0.15s ease-in-out',
          }}
        />
        
        {/* Expanded hover area */}
        <div 
          className="absolute inset-y-0"
          style={{
            left: '-4px',
            right: '-4px',
          }}
        />
      </div>

      {/* Drag overlay to prevent content interference */}
      {isDragging && (
        <div 
          className="absolute inset-0 z-40 cursor-col-resize"
          style={{
            backgroundColor: 'transparent',
            userSelect: 'none',
          }}
        />
      )}
    </div>
  );
} 
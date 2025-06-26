'use client';

import { useState, useEffect } from 'react';
import ResizableLayout from './ResizableLayout';
import MobileLayout from './MobileLayout';
import SeamlessDocumentViewer from './SeamlessDocumentViewer';
import ChatPanel from './ChatPanel';
import { getConversationDetails } from '@/services/api';

interface ResponsiveLayoutProps {
  conversationId: string;
}

export default function ResponsiveLayout({ conversationId }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [pdfTitle, setPdfTitle] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    
    const checkMobile = () => {
      // Check both screen width and touch capability
      const isMobileScreen = window.innerWidth < 768; // md breakpoint
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileScreen || (isTouchDevice && window.innerWidth < 1024));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    const loadConversationDetails = async () => {
      try {
        const details = await getConversationDetails(conversationId);
        setPdfTitle(details.fileName || details.title || '');
      } catch (error) {
        console.error('Failed to load conversation details:', error);
      }
    };

    if (conversationId) {
      loadConversationDetails();
    }
  }, [conversationId]);

  // Show loading state during hydration to prevent mismatch
  if (!isClient) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (isMobile) {
    return <MobileLayout conversationId={conversationId} pdfTitle={pdfTitle} />;
  }

  // Desktop layout with resizable panels
  return (
    <div className="flex-1 h-full">
      <ResizableLayout
        leftPanel={<SeamlessDocumentViewer conversationId={conversationId} pdfTitle={pdfTitle} />}
        rightPanel={<ChatPanel conversationId={conversationId} pdfTitle={pdfTitle} />}
        initialLeftWidth={55}
        minLeftWidth={25}
        maxLeftWidth={75}
      />
    </div>
  );
} 
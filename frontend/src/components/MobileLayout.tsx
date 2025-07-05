'use client';

import { useState } from 'react';
import { FileText, MessageCircle, Menu, X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SeamlessDocumentViewer from './SeamlessDocumentViewer';
import ChatPanel from './ChatPanel';
import Sidebar from './Sidebar';

interface MobileLayoutProps {
  conversationId: string;
  pdfTitle?: string;
}

type MobileView = 'chat' | 'pdf';

export default function MobileLayout({ conversationId, pdfTitle }: MobileLayoutProps) {
  const [currentView, setCurrentView] = useState<MobileView>('chat');
  const [showSidebar, setShowSidebar] = useState(false);
  const router = useRouter();

  const handleViewPDF = () => {
    setCurrentView('pdf');
  };

  const handleBackToChat = () => {
    setCurrentView('chat');
  };

  const handleToggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (currentView === 'pdf') {
    return (
      <>
        <div className="flex flex-col h-full bg-gradient-to-br from-white to-gray-50">
          {/* PDF Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#C0C9EE" }}>
                  <FileText className="w-4 h-4 text-gray-700" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Document</h2>
              </div>
            </div>
            <button
              onClick={handleBackToChat}
              className="flex items-center gap-2 px-4 py-2 btn-primary rounded-xl hover:shadow-md transition-all duration-200 group"
            >
              <MessageCircle size={18} className="transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm font-medium">Chat</span>
            </button>
          </div>

          {/* Seamless Document Viewer */}
          <div className="flex-1 overflow-hidden">
            <SeamlessDocumentViewer conversationId={conversationId} pdfTitle={pdfTitle} />
          </div>
        </div>

        {/* Mobile Sidebar Full Screen */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 bg-white animate-slide-in-left">
            <Sidebar onClose={handleToggleSidebar} isMobile={true} />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-gradient-to-br from-white to-gray-50">
        {/* Chat Panel with integrated header */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel 
            conversationId={conversationId} 
            pdfTitle={pdfTitle}
            onToggleSidebar={handleToggleSidebar}
            onViewPDF={handleViewPDF}
            showMobileControls={true}
          />
        </div>
      </div>

      {/* Mobile Sidebar Full Screen */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 bg-white animate-slide-in-left">
          <Sidebar onClose={handleToggleSidebar} isMobile={true} />
        </div>
      )}
    </>
  );
} 
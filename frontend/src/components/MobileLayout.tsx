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
                <div className="w-8 h-8 bg-gradient-to-br from-pink-200 to-amber-200 rounded-lg flex items-center justify-center">
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

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={handleToggleSidebar}>
            <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-pink-200 to-amber-200 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Menu</h3>
                </div>
                <button
                  onClick={handleToggleSidebar}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-gradient-to-br from-white to-gray-50">
        {/* Chat Header with View PDF Button */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-200 to-amber-200 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-gray-700" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
                <p className="text-xs text-gray-500">Ask questions about your document</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleViewPDF}
            className="flex items-center gap-2 px-4 py-2 btn-secondary rounded-xl hover:shadow-md transition-all duration-200 group"
          >
            <FileText size={18} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="text-sm font-medium">View PDF</span>
          </button>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel conversationId={conversationId} pdfTitle={pdfTitle} />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={handleToggleSidebar}>
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-pink-200 to-amber-200 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-gray-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Menu</h3>
              </div>
              <button
                onClick={handleToggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
} 
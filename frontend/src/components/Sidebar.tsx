"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PanelLeft, PanelRight, Plus, FileText, MessageSquare, Edit, Trash2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { getConversations, deleteConversation, renameConversation } from "@/services/api"
import ImprovedRenameDialog from "./RenameDialog"
import ImprovedDeleteDialog from "./DeleteConfirmDialog"
import { stripPdfExtension } from '@/lib/utils';

interface Conversation {
  id: string
  title: string
  fileName: string
  filePath: string
  createdAt: string
}

interface MinimalistSidebarProps {
  selectedConversation?: string | null
  onSelectConversation?: (id: string) => void
  onClose?: () => void
  isMobile?: boolean
  onConversationUpdate?: (conversationId: string, newTitle: string) => void
  onConversationDelete?: (conversationId: string) => void
}

export default function Sidebar({
  selectedConversation,
  onSelectConversation,
  onClose,
  isMobile,
  onConversationUpdate,
  onConversationDelete,
}: MinimalistSidebarProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; conversationId: string; title: string }>({
    open: false,
    conversationId: "",
    title: "",
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; conversationId: string; title: string }>({
    open: false,
    conversationId: "",
    title: "",
  })
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})
  const [isClient, setIsClient] = useState(false)

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Simple sidebar width management
  useEffect(() => {
    const sidebarWidth = isMobile ? "0px" : isExpanded ? "320px" : "64px"
    document.documentElement.style.setProperty("--sidebar-width", sidebarWidth)
  }, [isExpanded, isMobile])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width")
    }
  }, [])

  const activeConversationId =
    selectedConversation || (pathname.startsWith("/conversation/") ? pathname.split("/")[2] : null)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getConversations()
      setConversations(data)
    } catch (err) {
      console.error("Failed to load conversations:", err)
      setError("Failed to load conversations")
    } finally {
      setLoading(false)
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    if (onSelectConversation) {
      onSelectConversation(conversationId)
    } else {
      router.push(`/conversation/${conversationId}`)
    }
  }

  const handleNewChat = () => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';
    
    // Add event listener for file selection
    fileInput.addEventListener('change', async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        try {
          // Import the upload function dynamically to avoid SSR issues
          const { uploadPDF } = await import('@/services/api');
          
          // Upload the file - this now returns immediately with conversationId
          const response = await uploadPDF(file);
          
          // Navigate to the new conversation immediately
          // The conversation page will handle showing the processing status
          router.push(`/conversation/${response.conversationId}`);
          
          // Reload conversations list
          loadConversations();
          
        } catch (error) {
          console.error('Failed to upload PDF:', error);
          // You could add a toast notification here
          alert('Failed to upload PDF. Please try again.');
        }
      }
      
      // Clean up the file input
      document.body.removeChild(fileInput);
    });
    
    // Add to DOM and trigger click
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  const handleRenameClick = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenameDialog({
      open: true,
      conversationId: conversation.id,
      title: conversation.title,
    })
  }

  const handleDeleteClick = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteDialog({
      open: true,
      conversationId: conversation.id,
      title: conversation.title,
    })
  }

  const handleRename = async (newTitle: string) => {
    if (!renameDialog.conversationId) return

    setActionLoading((prev) => ({ ...prev, [renameDialog.conversationId]: true }))

    try {
      await renameConversation(renameDialog.conversationId, newTitle)

      // Update local state
      setConversations((prev) =>
        prev.map((conv) => (conv.id === renameDialog.conversationId ? { ...conv, title: newTitle } : conv)),
      )

      // Notify parent component
      if (onConversationUpdate) {
        onConversationUpdate(renameDialog.conversationId, newTitle)
      }

      setRenameDialog({ open: false, conversationId: "", title: "" })
    } catch (err) {
      console.error("Failed to rename conversation:", err)
      setError("Failed to rename conversation. Please try again.")
    } finally {
      setActionLoading((prev) => ({ ...prev, [renameDialog.conversationId]: false }))
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.conversationId) return

    setActionLoading((prev) => ({ ...prev, [deleteDialog.conversationId]: true }))

    try {
      await deleteConversation(deleteDialog.conversationId)

      // Update local state
      setConversations((prev) => prev.filter((conv) => conv.id !== deleteDialog.conversationId))

      // Notify parent component
      if (onConversationDelete) {
        onConversationDelete(deleteDialog.conversationId)
      }

      setDeleteDialog({ open: false, conversationId: "", title: "" })

      // If we deleted the currently selected conversation, redirect to home
      if (deleteDialog.conversationId === activeConversationId) {
        router.push("/")
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err)
      setError("Failed to delete conversation. Please try again.")
    } finally {
      setActionLoading((prev) => ({ ...prev, [deleteDialog.conversationId]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    // Use a stable format to prevent hydration mismatches
    // Only calculate relative dates on client side after hydration
    if (!isClient) {
      // Server-side or before hydration: use stable format
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
    
    // Client-side after hydration: can use relative dates
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div
      className="bg-[#F6F5F2] border-r border-black/10 flex flex-col h-full shadow-sm"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: isMobile ? "100%" : "320px",
        transform: isMobile ? "translateX(0)" : isExpanded ? "translateX(0)" : "translateX(-256px)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: isMobile ? 50 : 40,
        overflow: "hidden",
        willChange: "transform",
      }}
    >
      {/* Header */}
      <div className="border-b border-black/10 p-6 relative">
        {/* Expanded content */}
        <div
          className="flex items-center justify-between"
          style={{
            opacity: isExpanded ? 1 : 0,
            visibility: isExpanded ? "visible" : "hidden",
            transition: "opacity 0.2s ease-in-out, visibility 0.2s ease-in-out",
            transitionDelay: isExpanded ? "0.1s" : "0s",
          }}
        >
          <div
            className="cursor-pointer transition-all duration-200 ease-out hover:opacity-90"
            onClick={() => router.push("/")}
          >
            <h1 className="text-2xl font-bold text-black mb-1 tracking-tight">ChatPDF</h1>
            <p className="text-xs text-black/60 font-medium">Document Intelligence</p>
          </div>
          <button
            className="w-10 h-10 rounded-lg hover:bg-black/5 transition-all duration-200 ease-out flex items-center justify-center text-black/70 hover:text-black"
            onClick={isMobile && onClose ? onClose : () => setIsExpanded(!isExpanded)}
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="h-5 w-5 transition-transform duration-200 ease-out" />
          </button>
        </div>

        {/* Collapsed content */}
        <div
          className="absolute top-6 flex items-center justify-center w-10 h-10"
          style={{
            right: "12px",
            opacity: isExpanded ? 0 : 1,
            visibility: isExpanded ? "hidden" : "visible",
            transition: "opacity 0.2s ease-in-out, visibility 0.2s ease-in-out",
            transitionDelay: isExpanded ? "0s" : "0.1s",
          }}
        >
          <button
            className="w-10 h-10 rounded-lg hover:bg-black/5 transition-all duration-200 ease-out flex items-center justify-center text-black/70 hover:text-black"
            onClick={isMobile && onClose ? onClose : () => setIsExpanded(!isExpanded)}
            aria-label="Expand sidebar"
          >
            <PanelRight className="h-5 w-5 transition-transform duration-200 ease-out" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-h-0">
        {/* Expanded Content */}
        <div
          className="flex flex-col h-full"
          style={{
            opacity: isExpanded ? 1 : 0,
            visibility: isExpanded ? "visible" : "hidden",
            transition: "opacity 0.2s ease-in-out, visibility 0.2s ease-in-out",
            transitionDelay: isExpanded ? "0.1s" : "0s",
          }}
        >
          {/* New Chat Button */}
          <div className="p-6 pb-4 flex-shrink-0">
            <Button
              onClick={handleNewChat}
              className="w-full bg-black hover:bg-black/90 text-white h-11 rounded-xl font-medium transition-all duration-200 ease-out hover:shadow-md transform hover:translate-y-[-1px] active:translate-y-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Recent Chats Header */}
          <div className="px-6 pb-4 flex-shrink-0">
            <h2 className="text-sm font-semibold text-black/80">Recent Chats</h2>
          </div>

          {/* Conversations List - Fixed height with scroll */}
          <div className="flex-1 min-h-0 px-6 pb-6">
            <ScrollArea className="h-full [&_.scrollbar]:bg-black/10 [&_.scrollbar]:hover:bg-black/20 [&_.scrollbar-thumb]:bg-black/30 [&_.scrollbar-thumb]:hover:bg-black/50">
              <div className="space-y-1">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl animate-pulse"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="h-4 bg-black/10 rounded mb-2"></div>
                      <div className="h-3 bg-black/5 rounded w-20"></div>
                    </div>
                  ))
                ) : error ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-red-600 mb-4">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadConversations}
                      className="border-black/20 hover:bg-black hover:text-white transition-all duration-200 ease-out bg-transparent"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`w-full rounded-xl transition-all duration-200 ease-out group hover:translate-y-[-1px] active:translate-y-0 ${
                        conversation.id === activeConversationId
                          ? "bg-[#C0C9EE] shadow-sm"
                          : "hover:bg-black/5 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-3 p-4">
                        <div className="mt-0.5 flex-shrink-0">
                          <MessageSquare className="h-4 w-4 text-black/60 transition-colors duration-200 group-hover:text-black/80" />
                        </div>
                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => handleConversationSelect(conversation.id)}
                        >
                          <h3 className="font-medium text-black text-sm truncate mb-1">{stripPdfExtension(conversation.title)}</h3>
                          <p className="text-xs text-black/60">{formatDate(conversation.createdAt)}</p>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            className="p-1.5 rounded-md hover:bg-black/10 transition-all duration-200 ease-out text-black/40 hover:text-black/70 opacity-60 hover:opacity-100"
                            onClick={(e) => handleRenameClick(conversation, e)}
                            title="Rename conversation"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-md hover:bg-red-50 transition-all duration-200 ease-out text-black/40 hover:text-red-600 opacity-60 hover:opacity-100"
                            onClick={(e) => handleDeleteClick(conversation, e)}
                            title="Delete conversation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-6 w-6 text-black/30" />
                    </div>
                    <p className="text-sm font-medium text-black/60 mb-1">No conversations yet</p>
                    <p className="text-xs text-black/40">Upload a PDF to get started</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Collapsed Content */}
        <div
          className="absolute top-0 right-0 w-16 h-full flex flex-col"
          style={{
            opacity: isExpanded ? 0 : 1,
            visibility: isExpanded ? "hidden" : "visible",
            transition: "opacity 0.2s ease-in-out, visibility 0.2s ease-in-out",
            transitionDelay: isExpanded ? "0s" : "0.1s",
          }}
        >
          {/* Collapsed New Chat Button */}
          <div className="p-3 pt-6 flex-shrink-0">
            <button
              onClick={handleNewChat}
              className="w-10 h-10 bg-black hover:bg-black/90 text-white rounded-lg transition-all duration-200 ease-out flex items-center justify-center hover:shadow-md transform hover:translate-y-[-1px] active:translate-y-0"
              aria-label="New chat"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Collapsed Conversations - Fixed height with scroll */}
          <div className="flex-1 min-h-0 p-3">
            <ScrollArea className="h-full [&_.scrollbar]:bg-black/10 [&_.scrollbar]:hover:bg-black/20 [&_.scrollbar-thumb]:bg-black/30 [&_.scrollbar-thumb]:hover:bg-black/50">
              <div className="space-y-2">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="w-10 h-10 bg-black/10 rounded-lg animate-pulse"
                      style={{ animationDelay: `${index * 50}ms` }}
                    ></div>
                  ))
                ) : error ? (
                  <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                    <span className="text-red-500 text-xs font-bold">!</span>
                  </div>
                ) : conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      className={`w-10 h-10 rounded-lg transition-all duration-200 ease-out flex items-center justify-center transform hover:translate-y-[-1px] active:translate-y-0 ${
                        conversation.id === activeConversationId
                          ? "bg-[#C0C9EE] text-black shadow-sm"
                          : "bg-black/5 hover:bg-black/10 text-black/70 hover:shadow-sm"
                      }`}
                      onClick={() => handleConversationSelect(conversation.id)}
                      title={stripPdfExtension(conversation.title)}
                    >
                      <FileText className="h-4 w-4 transition-colors duration-200" />
                    </button>
                  ))
                ) : (
                  <div className="w-10 h-10 bg-black/5 rounded-lg flex items-center justify-center">
                    <span className="text-black/30 text-xs">0</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Collapsed User Details */}
          <div className="p-3 pb-4 flex-shrink-0">
            <div className="w-10 h-10 bg-black/10 rounded-lg flex items-center justify-center">
              <span className="text-black/50 text-xs font-medium">U</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Section - Expanded State */}
      <div 
        className="border-t border-black/10 p-4 flex-shrink-0"
        style={{
          opacity: isExpanded ? 1 : 0,
          visibility: isExpanded ? "visible" : "hidden",
          transition: "opacity 0.2s ease-in-out, visibility 0.2s ease-in-out",
          transitionDelay: isExpanded ? "0.1s" : "0s",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center">
            <span className="text-black/60 text-sm font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-black truncate">User Name</p>
            <p className="text-xs text-black/50 truncate">user@example.com</p>
          </div>
          <button className="p-1.5 rounded-md hover:bg-black/5 transition-all duration-200 ease-out text-black/40 hover:text-black/70">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Rename Dialog */}
      <ImprovedRenameDialog
        open={renameDialog.open}
        onOpenChange={(open) => setRenameDialog((prev) => ({ ...prev, open }))}
        currentTitle={renameDialog.title}
        onRename={handleRename}
        isLoading={actionLoading[renameDialog.conversationId]}
      />

      {/* Delete Confirmation Dialog */}
      <ImprovedDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        title={deleteDialog.title}
        onConfirm={handleDelete}
        isLoading={actionLoading[deleteDialog.conversationId]}
      />
    </div>
  )
}

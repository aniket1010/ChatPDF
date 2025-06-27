"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PanelLeft, PanelRight, Plus, FileText, MessageSquare } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { getConversations } from "@/services/api"

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
}

export default function Sidebar({ selectedConversation, onSelectConversation }: MinimalistSidebarProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    console.log("New chat clicked")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
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
      className={`bg-[#F9F4EB] border-r border-black/10 transition-all duration-300 ease-out ${
        isExpanded ? "w-80" : "w-16"
      } flex flex-col h-full shadow-sm`}
    >
      {/* Header */}
      <div className={`border-b border-black/10 ${isExpanded ? "px-6 py-6" : "px-3 py-6"}`}>
        <div className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
          {isExpanded && (
            <div
              className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
              onClick={() => router.push("/")}
            >
              <h1 className="text-2xl font-bold text-black mb-1 tracking-tight">ChatPDF</h1>
              <p className="text-xs text-black/60 font-medium">Document Intelligence</p>
            </div>
          )}
          <button
            className="w-10 h-10 rounded-lg hover:bg-black/5 transition-colors duration-200 flex items-center justify-center text-black/70 hover:text-black"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? <PanelLeft className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <>
          {/* New Chat Button */}
          <div className="p-6 pb-4">
            <Button
              onClick={handleNewChat}
              className="w-full bg-black hover:bg-black/90 text-white h-11 rounded-xl font-medium transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Recent Chats Header */}
          <div className="px-6 pb-4">
            <h2 className="text-sm font-semibold text-black/80">Recent Chats</h2>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            <div className="px-6 pb-6 space-y-1">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl animate-pulse"
                    style={{ animationDelay: `${index * 100}ms` }}
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
                    className="border-black/20 hover:bg-black hover:text-white transition-colors duration-200"
                  >
                    Try Again
                  </Button>
                </div>
              ) : conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 group ${
                      conversation.id === activeConversationId ? "bg-[#C0C9EE] shadow-sm" : "hover:bg-black/5"
                    }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <MessageSquare className="h-4 w-4 text-black/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-black text-sm truncate mb-1">{conversation.title}</h3>
                        <p className="text-xs text-black/60">{formatDate(conversation.createdAt)}</p>
                      </div>
                    </div>
                  </button>
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
        </>
      ) : (
        <>
          {/* Collapsed New Chat Button */}
          <div className="p-3 pt-6">
            <button
              onClick={handleNewChat}
              className="w-10 h-10 bg-black hover:bg-black/90 text-white rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-md active:scale-95"
              aria-label="New chat"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Collapsed Conversations */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 bg-black/10 rounded-lg animate-pulse"
                    style={{ animationDelay: `${index * 100}ms` }}
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
                    className={`w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95 ${
                      conversation.id === activeConversationId
                        ? "bg-[#C0C9EE] text-black shadow-sm"
                        : "bg-black/5 hover:bg-black/10 text-black/70"
                    }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                    title={conversation.title}
                  >
                    <FileText className="h-4 w-4" />
                  </button>
                ))
              ) : (
                <div className="w-10 h-10 bg-black/5 rounded-lg flex items-center justify-center">
                  <span className="text-black/30 text-xs">0</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}

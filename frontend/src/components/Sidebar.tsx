"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PanelLeft, PanelRight, Plus, FileText, Sparkles } from "lucide-react"
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

  // Extract active conversation ID from pathname if not provided via props
  const activeConversationId =
    selectedConversation || (pathname.startsWith("/conversation/") ? pathname.split("/")[2] : null)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading conversations from API...")
      const data = await getConversations()
      console.log("Loaded conversations:", data)
      setConversations(data)
    } catch (err) {
      console.error("Failed to load conversations:", err)
      setError("Failed to load conversations. Make sure the backend is running.")
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
    // TODO: Implement new chat functionality
  }

  return (
    <div
      className={`bg-[#F9F4EB] border-r border-gray-200 transition-all duration-500 ease-in-out ${
        isExpanded ? "w-80" : "w-16"
      } flex flex-col font-sans relative overflow-hidden h-full shadow-sm`}
    >
      {/* Header */}
      <div className={`border-b border-gray-200 relative ${isExpanded ? "px-6 py-6" : "px-3 py-6"}`}>
        <div
          className={`flex items-center transition-all duration-300 ${isExpanded ? "justify-between" : "justify-center"}`}
        >
          {isExpanded && (
            <div
              className="animate-fade-in cursor-pointer group"
              onClick={() => router.push("/")}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-200 to-amber-200 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gray-700" />
                </div>
                <div className="text-xl font-bold text-gray-800">ChatPDF</div>
              </div>
              <div className="text-xs text-gray-600 font-medium tracking-wide uppercase">
                Document Intelligence
              </div>
            </div>
          )}
          <button
            className="w-10 h-10 cursor-pointer transition-all duration-300 hover:bg-white/60 active:scale-95 text-gray-700 flex items-center justify-center group rounded-lg"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <PanelLeft className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            ) : (
              <PanelRight className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
            )}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <>
          {/* New Chat */}
          <div className="px-6 py-4">
            <Button
              onClick={handleNewChat}
              className="w-full btn-primary h-12 rounded-xl shadow-sm hover:shadow-md group"
            >
              <Plus className="h-4 w-4 mr-3 transition-transform duration-200 group-hover:rotate-90" />
              <span className="font-semibold">New Chat</span>
            </Button>
          </div>

          {/* Conversations Header */}
          <div className="px-6 pb-4">
            <div className="text-lg font-semibold text-gray-700">Recent Chats</div>
            <div className="text-sm text-gray-500 mt-1">Your document conversations</div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1 scrollbar-custom">
            <div className="space-y-2 px-6 pb-6">
              {loading ? (
                // Enhanced loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white/50 animate-pulse"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 w-20 rounded"></div>
                  </div>
                ))
              ) : error ? (
                <div className="p-6 text-center animate-fade-in">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-red-500 text-lg">⚠</span>
                  </div>
                  <div className="text-red-600 text-sm mb-4 font-medium">{error}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadConversations}
                    className="btn-secondary text-sm"
                  >
                    Try Again
                  </Button>
                </div>
              ) : (
                conversations.map((conversation, index) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer transition-all duration-300 rounded-xl group hover:scale-[1.02] sidebar-item ${
                      conversation.id === activeConversationId
                        ? "bg-pink-200 shadow-md border border-pink-300"
                        : "bg-white/60 hover:bg-white hover:shadow-sm"
                    }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        conversation.id === activeConversationId 
                          ? "bg-pink-300" 
                          : "bg-amber-200"
                      }`}>
                        <FileText className="w-4 h-4 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 mb-1 truncate">
                          {conversation.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {!loading && !error && conversations.length === 0 && (
                <div className="p-8 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-200 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="text-gray-600 font-medium mb-2">No conversations yet</div>
                  <div className="text-gray-500 text-sm">
                    Upload a PDF to get started
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-400 font-light">✨ Powered by AI ✨</div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Collapsed New Chat Icon */}
          <div className="px-3 py-4 flex justify-center">
            <button
              onClick={handleNewChat}
              className="w-10 h-10 cursor-pointer transition-all duration-300 btn-primary hover:shadow-md active:scale-95 flex items-center justify-center rounded-lg group"
            >
              <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
            </button>
          </div>

          {/* Collapsed Conversations */}
          <ScrollArea className="flex-1 scrollbar-custom">
            <div className="space-y-3 px-3 py-4">
              {loading ? (
                // Loading skeleton for collapsed state
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 bg-gray-300 animate-pulse rounded-lg mx-auto"
                    style={{ animationDelay: `${index * 100}ms` }}
                  ></div>
                ))
              ) : error ? (
                <div className="w-10 h-10 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center mx-auto transition-all duration-200 hover:scale-105">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
              ) : (
                conversations.map((conversation, index) => (
                  <button
                    key={conversation.id}
                    className={`w-10 h-10 cursor-pointer transition-all duration-300 rounded-lg flex items-center justify-center mx-auto hover:scale-105 active:scale-95 shadow-sm hover:shadow-md ${
                      conversation.id === activeConversationId
                        ? "bg-pink-200 border border-pink-300 text-gray-800"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-amber-100"
                    }`}
                    onClick={() => handleConversationSelect(conversation.id)}
                    title={conversation.title}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <FileText className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
                  </button>
                ))
              )}

              {!loading && !error && conversations.length === 0 && (
                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center mx-auto transition-all duration-200 hover:scale-105">
                  <span className="text-gray-400 text-xs font-light">0</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Collapsed Footer */}
          <div className="px-3 py-4 border-t border-gray-200">
            <div className="text-center">
              <span className="text-xs text-gray-400 font-light">✨</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

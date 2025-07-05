"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { getConversationMessages, sendChatMessage } from "@/services/api"
import { Send, Bot, User, Sparkles, Menu, FileText } from "lucide-react"
import HtmlRenderer from "./HtmlRenderer"

interface Message {
  id: string
  text: string
  originalText?: string
  contentType?: 'text' | 'html' | 'markdown'
  isUser: boolean
  timestamp: Date
  processedAt?: Date
}

interface ChatPanelProps {
  conversationId: string
  pdfTitle?: string
  onToggleSidebar?: () => void
  onViewPDF?: () => void
  showMobileControls?: boolean
}

export default function ChatPanel({ conversationId, pdfTitle, onToggleSidebar, onViewPDF, showMobileControls }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = useCallback(async () => {
    if (!conversationId) return
    setIsLoading(true)
    setError(null)
    try {
      const fetchedMessages = await getConversationMessages(conversationId)
      setMessages(fetchedMessages)
    } catch (err) {
      console.error("Failed to load messages:", err)
      setError("Failed to load messages. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const handleSendMessage = async () => {
    if (inputMessage.trim() && !isLoading) {
      const text = inputMessage.trim()
      setInputMessage("")

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text,
        isUser: true,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])

      setIsLoading(true)

      try {
        const aiMessage = await sendChatMessage(conversationId, text)
        setMessages((prev) => [...prev, aiMessage])
      } catch (err) {
        console.error("Failed to send message:", err)
        setError("Failed to send message. Please try again.")
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Enhanced Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white/80 backdrop-blur-sm border-b border-black/10 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {showMobileControls && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div className="relative">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "#C0C9EE" }}
              >
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold text-black/60 uppercase tracking-wider">AI Assistant</h3>
                <Sparkles className="w-3 h-3 text-black/40" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-black truncate">
                {pdfTitle || 'Document Analysis'}
              </h2>
            </div>
          </div>
          {showMobileControls && onViewPDF && (
            <button
              onClick={onViewPDF}
              className="flex items-center gap-2 px-4 py-2 btn-secondary rounded-xl hover:shadow-md transition-all duration-200 group"
            >
              <FileText className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-sm font-medium">View PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse"
                style={{ backgroundColor: "#C0C9EE" }}
              >
                <Bot className="w-8 h-8 text-black" />
              </div>
              <p className="text-black/70 font-medium">Loading conversation...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-red-500 text-2xl">⚠</span>
              </div>
              <p className="text-red-600 mb-6 font-semibold text-lg">{error}</p>
              <button
                onClick={loadMessages}
                className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-black/90 transition-colors shadow-lg"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in max-w-md px-4">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl"
                style={{ backgroundColor: "#C0C9EE" }}
              >
                <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-black" />
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-black mb-4">Ready to help!</h4>
              <p className="text-black/70 text-base sm:text-lg leading-relaxed">
                Ask me anything about your PDF document. I can help you understand, summarize, or analyze the content.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-white/60 rounded-full text-sm text-black/70 font-medium">Summarize</span>
                <span className="px-3 py-1 bg-white/60 rounded-full text-sm text-black/70 font-medium">
                  Extract key points
                </span>
                <span className="px-3 py-1 bg-white/60 rounded-full text-sm text-black/70 font-medium">
                  Ask questions
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.isUser ? "items-end" : "items-start"} animate-slide-up w-full`}
              >
                <div
                  className={`flex items-start gap-2 sm:gap-3 ${message.isUser ? "flex-row-reverse" : "flex-row"} w-full max-w-full`}
                >
                  {/* Enhanced Avatar */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                      message.isUser ? "bg-black" : ""
                    }`}
                    style={!message.isUser ? { backgroundColor: "#C0C9EE" } : {}}
                  >
                    {message.isUser ? (
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                    )}
                  </div>

                  {/* Enhanced Message Content */}
                  <div
                    className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-sm min-w-0 ${
                      message.isUser ? "bg-black text-white rounded-tr-md" : "rounded-tl-md border border-black/5"
                    }`}
                    style={{
                      maxWidth: 'min(calc(100vw - 120px), 600px)',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                      ...(!message.isUser ? { backgroundColor: "#F6F5F2", color: "black" } : {})
                    }}
                  >
                    <div 
                      className="text-sm leading-relaxed font-medium w-full" 
                      style={{ 
                        wordBreak: 'break-word', 
                        overflowWrap: 'break-word',
                        overflow: 'hidden',
                        hyphens: 'auto'
                      }}
                    >
                      <HtmlRenderer 
                        content={message.text}
                        contentType={message.contentType || 'text'}
                        isUserMessage={message.isUser}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Timestamp outside bubble */}
                <div className={`text-xs text-black/50 mt-1 ${message.isUser ? "mr-8 sm:mr-11" : "ml-8 sm:ml-11"}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}

            {/* Enhanced Loading indicator */}
            {isLoading && messages.length > 0 && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-md"
                    style={{ backgroundColor: "#C0C9EE" }}
                  >
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                  </div>
                  <div className="bg-white px-3 py-2 rounded-2xl rounded-tl-md shadow-lg border border-black/5">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-black/40 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-black/40 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-black/40 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-black/70 font-medium">Analyzing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white/80 backdrop-blur-sm border-t border-black/10 flex-shrink-0">
        <div className="flex items-end space-x-3 sm:space-x-4">
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your document..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-black/10 rounded-2xl bg-white text-black placeholder-black/50 focus:outline-none focus:border-black/30 resize-none text-sm transition-all duration-200 font-medium shadow-sm"
              rows={1}
              disabled={isLoading}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-black text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group shadow-lg hover:bg-black/90 transition-all duration-200 flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

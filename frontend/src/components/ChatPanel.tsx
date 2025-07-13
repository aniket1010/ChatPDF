"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Send, Bot, User, Sparkles, Menu, FileText } from "lucide-react"

// NOTE: The following imports are assumed to exist based on your code.
// You should have these files and functions in your project.
import { getConversationMessages, sendChatMessage, getConversationSummary } from "@/services/api"
import HtmlRenderer from "./HtmlRenderer"
import { stripPdfExtension } from "@/lib/utils"

interface Message {
  id: string
  text: string
  originalText?: string
  contentType?: "text" | "html" | "markdown"
  isUser: boolean
  timestamp: Date
  processedAt?: Date
  status?: "pending" | "processing" | "completed" | "failed"
}

interface ChatPanelProps {
  conversationId: string
  pdfTitle?: string
  onToggleSidebar?: () => void
  onViewPDF?: () => void
  showMobileControls?: boolean
}

export default function ChatPanel({
  conversationId,
  pdfTitle,
  onToggleSidebar,
  onViewPDF,
  showMobileControls,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const [summaryData, setSummaryData] = useState<{ summary: string; commonQuestions: string[] }>({
    summary: "",
    commonQuestions: [],
  })
  const [showSummary, setShowSummary] = useState(false)

  const startPollingForAIResponse = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setIsAnalyzing(true)
    pollingRef.current = setInterval(async () => {
      const fetchedMessagesRaw = await getConversationMessages(conversationId)
      const fetchedMessages = fetchedMessagesRaw.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        processedAt: msg.processedAt ? new Date(msg.processedAt) : undefined,
      }))
      const lastUserIndex = fetchedMessages.map((m: any) => m.isUser).lastIndexOf(true)
      const aiAfterUser = fetchedMessages.slice(lastUserIndex + 1).find((m: any) => !m.isUser)
      setMessages(fetchedMessages)
      if (aiAfterUser) {
        setIsAnalyzing(false)
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      }
    }, 2000)
  }, [conversationId])

  useEffect(() => {
    async function fetchSummary() {
      try {
        console.log('Fetching summary for conversation:', conversationId)
        const data = await getConversationSummary(conversationId)
        console.log('Summary data received:', data)
        if (data) {
          let questions: string[] = []
          if (data.commonQuestions) {
            const liMatches = Array.from(data.commonQuestions.matchAll(/<li[^>]*>(.*?)<\/li>/gi))
            if (liMatches.length > 0) {
              questions = liMatches.map((m: any) => m[1].replace(/<[^>]+>/g, "").trim())
            } else {
              questions = (
                Array.isArray(data.commonQuestions) ? data.commonQuestions : data.commonQuestions.split("\n")
              )
                .map((q: string) => q.replace(/^[-•*]\s*/, "").trim())
                .filter((q: string) => q.length > 0)
            }
          }
          console.log('Processed summary data:', { summary: data.summary || "", commonQuestions: questions })
          setSummaryData({ summary: data.summary || "", commonQuestions: questions })
        } else {
          console.error("API did not return summary data.")
        }
      } catch (err) {
        console.error('Error fetching summary:', err)
        // Ignore summary errors for now
      }
    }
    fetchSummary()
  }, [conversationId])

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = useCallback(async () => {
    if (!conversationId) return
    console.log('Loading messages for conversation:', conversationId)
    setIsLoading(true)
    setError(null)
    try {
      const fetchedMessagesRaw = await getConversationMessages(conversationId)
      console.log('Raw messages received:', fetchedMessagesRaw)
      if (Array.isArray(fetchedMessagesRaw)) {
        const fetchedMessages = fetchedMessagesRaw.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          processedAt: msg.processedAt ? new Date(msg.processedAt) : undefined,
        }))
        console.log('Processed messages:', fetchedMessages)
        setMessages(fetchedMessages)
      } else {
        console.error("API did not return an array of messages:", fetchedMessagesRaw)
        setError("Failed to load conversation due to invalid data.")
      }
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

  const handleSendMessage = async (messageText?: string) => {
    const text = (messageText || inputMessage).trim()
    if (text && !isLoading && !isAnalyzing) {
      setInputMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
      const tempId = `user-temp-${Date.now()}`
      const userMessage: Message = {
        id: tempId,
        text,
        isUser: true,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, userMessage])
      setIsAnalyzing(true)
      setIsLoading(true)
      try {
        await sendChatMessage(conversationId, text)
        startPollingForAIResponse()
      } catch (err) {
        console.error("Failed to send message:", err)
        setError("Failed to send message. Please try again.")
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
        setIsAnalyzing(false)
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
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
  }

  const handleShowSummary = () => {
    setShowSummary(true)
    setMessages((prev) => [
      ...prev,
      {
        id: `summary-${Date.now()}`,
        text: summaryData.summary,
        isUser: false,
        timestamp: new Date(),
        contentType: "html",
      },
    ])
  }

  const handleKeyQuestion = (question: string) => {
    handleSendMessage(question)
  }

  return (
    <div
      className="w-full h-full flex flex-col bg-white"
      style={{
        contain: "layout style paint size",
        isolation: "isolate",
      }}
    >
      {/* Enhanced Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white/80 backdrop-blur-sm border-b border-black/10 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {showMobileControls && onToggleSidebar && (
              <button onClick={onToggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                {pdfTitle ? stripPdfExtension(pdfTitle) : "Document Analysis"}
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
        ) : (
          <>
            {/* Summary and Questions Section */}
            {messages.length === 0 && summaryData.summary && (
              <div className="space-y-6 animate-fade-in">
                {/* Summary Button */}
                {summaryData.summary && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleShowSummary}
                      className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 shadow-md max-w-md w-full"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-5 h-5" />
                        <span>View Document Summary</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Key Questions Grid */}
                {summaryData.commonQuestions.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-center text-lg font-semibold text-gray-800 mb-4">
                      Key Questions You Can Ask
                    </h3>
                    <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto">
                      {summaryData.commonQuestions.slice(0, 3).map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleKeyQuestion(question)}
                          className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-gray-300 hover:shadow-md transition-all duration-200 text-sm font-medium text-gray-700"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.isUser ? "items-end" : "items-start"} animate-slide-up w-full`}
              >
                <div
                  className={`flex items-start gap-2 sm:gap-3 ${message.isUser ? "flex-row-reverse" : "flex-row"} w-full max-w-full`}
                >
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
                  <div
                    className={`px-2 py-1.5 sm:px-3 sm:py-2 rounded-2xl shadow-sm min-w-0 ${
                      message.isUser ? "bg-black text-white rounded-tr-md" : "rounded-tl-md border border-black/5"
                    }`}
                    style={{
                      maxWidth: "min(calc(100vw - 120px), 600px)",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      overflow: "hidden",
                      ...(!message.isUser ? { backgroundColor: "#F6F5F2", color: "black" } : {}),
                    }}
                  >
                    <div
                      className="text-sm leading-relaxed font-medium w-full"
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        overflow: "hidden",
                        hyphens: "auto",
                      }}
                    >
                      <HtmlRenderer
                        content={message.text}
                        contentType={message.contentType || "text"}
                        isUserMessage={message.isUser}
                      />
                    </div>
                  </div>
                </div>
                <div className={`text-xs text-black/50 mt-1 ${message.isUser ? "mr-8 sm:mr-11" : "ml-8 sm:ml-11"}`}>
                  {message.timestamp instanceof Date
                    ? message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
            {isAnalyzing && messages.length > 0 && messages[messages.length - 1]?.isUser && (
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
              disabled={isLoading || isAnalyzing}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading || isAnalyzing}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-black text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group shadow-lg hover:bg-black/90 transition-all duration-200 flex-shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

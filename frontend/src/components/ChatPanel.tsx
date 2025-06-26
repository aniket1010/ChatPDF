'use client';

import { useState, useEffect, useCallback } from 'react';
import { getConversationMessages, sendChatMessage } from '@/services/api';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatPanelProps {
  conversationId: string;
  pdfTitle?: string;
}

export default function ChatPanel({ conversationId, pdfTitle }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedMessages = await getConversationMessages(conversationId);
      setMessages(fetchedMessages);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() && !isLoading) {
      const text = inputMessage.trim();
      setInputMessage('');
      
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        text,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      
      setIsLoading(true);

      try {
        const aiMessage = await sendChatMessage(conversationId, text);
        setMessages((prev) => [...prev, aiMessage]);
      } catch (err) {
        console.error('Failed to send message:', err);
        setError('Failed to send message. Please try again.');
        // Optionally remove the optimistic user message
        setMessages((prev) => prev.filter(msg => msg.id !== userMessage.id));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-white to-gray-50">
      {/* AI Assistant Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-200 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-200 to-amber-200 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                AI Assistant
              </h3>
              <h2 className="text-lg font-semibold text-gray-900">
                Document Analysis
              </h2>
            </div>
          </div>
        </div>
        {pdfTitle && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <p className="text-sm text-gray-600 font-medium">
                {pdfTitle.replace('.pdf', '')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 scrollbar-custom">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-200 to-amber-200 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Bot className="w-6 h-6 text-gray-700" />
              </div>
              <p className="text-gray-600">Loading conversation...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-xl">⚠</span>
              </div>
              <p className="text-red-500 mb-4 font-medium">{error}</p>
              <button 
                onClick={loadMessages} 
                className="btn-secondary px-4 py-2 rounded-lg font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-200 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-gray-700" />
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-3">
                Start a conversation
              </h4>
              <p className="text-gray-600 max-w-sm">
                Ask any question about your PDF document. I'm here to help you understand and analyze the content.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div className={`flex items-start gap-3 max-w-2xl ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.isUser 
                    ? 'bg-pink-200' 
                    : 'bg-amber-200'
                }`}>
                  {message.isUser ? (
                    <User className="w-4 h-4 text-gray-700" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-700" />
                  )}
                </div>
                
                {/* Message Content */}
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                  message.isUser
                    ? 'message-user rounded-tr-md'
                    : 'message-ai rounded-tl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator for new messages */}
        {isLoading && messages.length > 0 && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-700" />
              </div>
              <div className="bg-amber-100 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 bg-white border-t border-gray-200 flex-shrink-0">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your document..."
              className="w-full p-4 border border-gray-300 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent resize-none text-sm transition-all duration-200"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="w-12 h-12 btn-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
          >
            <Send className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
}

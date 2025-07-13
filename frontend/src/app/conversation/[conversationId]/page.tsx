'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components';
import { getConversationDetails } from '@/services/api';
import axios from 'axios';
import { use } from 'react';

interface ConversationDetails {
  id: string;
  title: string;
  filePath: string;
  createdAt: string;
}

interface ConversationClientProps {
  conversationId: string;
}

function ConversationClient({ conversationId }: ConversationClientProps) {
  const router = useRouter();
  
  const [conversationDetails, setConversationDetails] = useState<ConversationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading conversation details for ID:', conversationId);
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000');
      
      const details = await getConversationDetails(conversationId);
      console.log('Conversation details loaded:', details);
      setConversationDetails(details);
      
    } catch (err) {
      console.error('Failed to load conversation:', err);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('Conversation not found');
      } else {
        setError('Failed to load conversation');
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);
  
  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !conversationDetails) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-800">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            {error || 'Conversation Not Found'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error === 'Conversation not found' 
              ? "The conversation you're looking for doesn't exist or may have been deleted."
              : 'There was an error loading the conversation. Please try again.'
            }
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={handleBackToHome}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Back to Home
            </button>
            
            {error && error !== 'Conversation not found' && (
              <button 
                onClick={loadConversation}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      filePath={conversationDetails.filePath}
      conversationId={conversationDetails.id}
    />
  );
}

interface ConversationPageProps {
  params: Promise<{
    conversationId: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  
  console.log('ConversationPage rendered with ID:', conversationId);
  
  return <ConversationClient conversationId={conversationId} />;
}
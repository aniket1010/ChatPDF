'use client';

import { useState, useEffect } from 'react';
import { FileText, RefreshCw, ChevronRight, BookOpen, Lightbulb, List, Clock } from 'lucide-react';
import { getConversationSummary, generateConversationSummary } from '@/services/api';

interface SummaryData {
  id: string;
  title: string;
  fileName: string;
  summary: string | null;
  keyFindings: string | null;
  introduction: string | null;
  tableOfContents: string | null;
  summaryGeneratedAt: string | null;
  createdAt: string;
  needsGeneration?: boolean;
  message?: string;
}

interface PDFSummaryPageProps {
  conversationId: string;
  onNavigateToPage: (pageNumber: number) => void;
}

export default function PDFSummaryPage({ conversationId, onNavigateToPage }: PDFSummaryPageProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [conversationId]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversationSummary(conversationId);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
      setError('Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setGenerating(true);
      setError(null);
      const data = await generateConversationSummary(conversationId);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setError('Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {line}
      </p>
    ));
  };

  const formatBulletPoints = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    return (
      <ul className="space-y-0.5 ml-6">
        {lines.map((line, index) => (
          <li key={index} className="list-disc text-gray-900">
            {line.replace(/^[-•*]\s*/, '')}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Summary</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadSummary}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <p className="text-gray-600">No summary data available</p>
      </div>
    );
  }

  const needsGeneration = summaryData.needsGeneration || !summaryData.summary;

  return (
    <div className="bg-white h-full overflow-y-auto" style={{ fontFamily: 'Times, serif' }}>
      {/* PDF-like page container - More compact */}
      <div className="max-w-[8.5in] mx-auto bg-white px-12 py-8">
        {/* Document Header - More compact */}
        <div className="text-center mb-4 pb-2 border-b border-gray-400">
          <h1 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Times, serif' }}>
            {summaryData.fileName.replace('.pdf', '')}
          </h1>
          <p className="text-sm text-gray-600 italic">Document Overview</p>
        </div>

        {/* Compact content layout */}
        <div className="space-y-3 text-gray-900" style={{ lineHeight: '1.3' }}>
          {/* Abstract */}
          <section>
            <h2 className="text-base font-bold mb-1 text-gray-900" style={{ fontFamily: 'Times, serif' }}>
              Abstract
            </h2>
            <div className="text-justify text-sm leading-snug">
              {summaryData?.summary ? (
                formatText(summaryData.summary)
              ) : (
                <p className="italic text-gray-600">
                  {generating ? 'Generating summary...' : 'This document contains valuable information. Summary will be generated automatically.'}
                </p>
              )}
            </div>
          </section>

          {/* Key Findings */}
          <section>
            <h2 className="text-base font-bold mb-1 text-gray-900" style={{ fontFamily: 'Times, serif' }}>
              Key Findings
            </h2>
            <div className="text-sm leading-snug">
              {summaryData?.keyFindings ? (
                formatBulletPoints(summaryData.keyFindings)
              ) : (
                <ul className="space-y-0.5 ml-6 italic text-gray-600">
                  <li className="list-disc">{generating ? 'Analyzing document...' : 'Key insights will be extracted from the document'}</li>
                  <li className="list-disc">{generating ? 'Extracting findings...' : 'Important conclusions will be highlighted'}</li>
                  <li className="list-disc">{generating ? 'Processing content...' : 'Main discoveries will be summarized'}</li>
                </ul>
              )}
            </div>
          </section>

          {/* Introduction */}
          <section>
            <h2 className="text-base font-bold mb-1 text-gray-900" style={{ fontFamily: 'Times, serif' }}>
              Introduction
            </h2>
            <div className="text-justify text-sm leading-snug">
              {summaryData?.introduction ? (
                formatText(summaryData.introduction)
              ) : (
                <p className="italic text-gray-600">
                  {generating ? 'Preparing introduction...' : 'This section will provide an overview of the document\'s purpose and scope.'}
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Auto-generate if needed */}
        {needsGeneration && !generating && (
          <div className="hidden">
            {(() => {
              // Auto-trigger generation
              setTimeout(() => handleGenerateSummary(), 1000);
              return null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
} 
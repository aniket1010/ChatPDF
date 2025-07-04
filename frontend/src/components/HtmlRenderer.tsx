'use client';

import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface HtmlRendererProps {
  content: string;
  className?: string;
  isUserMessage?: boolean;
  contentType?: 'text' | 'html' | 'markdown';
}

export default function HtmlRenderer({ 
  content, 
  className = '', 
  isUserMessage = false,
  contentType = 'text'
}: HtmlRendererProps) {
  
  // If content is plain text, render it normally
  if (contentType === 'text') {
    return (
      <div className={`${className} whitespace-pre-wrap`}>
        {content}
      </div>
    );
  }

  // For HTML content, sanitize and render
  const sanitizedHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'b', 'em', 'i', 'u',
      'ul', 'ol', 'li',
      'blockquote',
      'code', 'pre',
      'a',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'title',
      'class', 'id',
      'start'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });

  return (
    <div 
      className={`html-content ${className} ${isUserMessage ? 'user-message' : 'ai-message'}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}
    />
  );
} 
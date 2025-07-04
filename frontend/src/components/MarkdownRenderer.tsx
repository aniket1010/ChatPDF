'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUserMessage?: boolean;
}

export default function MarkdownRenderer({ content, className = '', isUserMessage = false }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Headings
          h1: ({children}) => (
            <h1 className={`text-lg font-bold mb-2 mt-3 first:mt-0 ${isUserMessage ? 'text-white' : 'text-black'}`}>
              {children}
            </h1>
          ),
          h2: ({children}) => (
            <h2 className={`text-base font-bold mb-2 mt-3 first:mt-0 ${isUserMessage ? 'text-white' : 'text-black'}`}>
              {children}
            </h2>
          ),
          h3: ({children}) => (
            <h3 className={`text-sm font-bold mb-1 mt-2 first:mt-0 ${isUserMessage ? 'text-white' : 'text-black'}`}>
              {children}
            </h3>
          ),
          
          // Paragraphs
          p: ({children}) => (
            <p className={`mb-2 last:mb-0 leading-relaxed ${isUserMessage ? 'text-white' : 'text-black'}`}>
              {children}
            </p>
          ),
          
          // Lists
          ul: ({children}) => (
            <ul className={`mb-2 ml-4 space-y-1 ${isUserMessage ? 'text-white' : 'text-black'}`}>
              {children}
            </ul>
          ),
          ol: ({children}) => (
            <ol className={`mb-2 ml-4 space-y-1 list-decimal ${isUserMessage ? 'text-white' : 'text-black'}`}>
              {children}
            </ol>
          ),
          li: ({children}) => (
            <li className={`${isUserMessage ? 'text-white' : 'text-black'} list-disc`}>
              {children}
            </li>
          ),
          
          // Code blocks
          code: ({inline, className, children, ...props}: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <div className="my-2 rounded-lg overflow-hidden">
                <pre className="bg-gray-900 text-gray-100 p-3 overflow-x-auto text-xs">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code 
                className={`${isUserMessage ? 'bg-white/20 text-white' : 'bg-black/10 text-black'} px-1 py-0.5 rounded text-xs font-mono`} 
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Blockquotes
          blockquote: ({children}) => (
            <blockquote className={`border-l-4 pl-4 my-2 italic ${
              isUserMessage ? 'border-white/40 text-white/90' : 'border-black/20 text-black/80'
            }`}>
              {children}
            </blockquote>
          ),
          
          // Tables
          table: ({children}) => (
            <div className="my-2 overflow-x-auto">
              <table className={`min-w-full border-collapse border ${
                isUserMessage ? 'border-white/30' : 'border-black/20'
              }`}>
                {children}
              </table>
            </div>
          ),
          th: ({children}) => (
            <th className={`border px-2 py-1 text-xs font-semibold ${
              isUserMessage ? 'border-white/30 bg-white/10 text-white' : 'border-black/20 bg-black/5 text-black'
            }`}>
              {children}
            </th>
          ),
          td: ({children}) => (
            <td className={`border px-2 py-1 text-xs ${
              isUserMessage ? 'border-white/30 text-white' : 'border-black/20 text-black'
            }`}>
              {children}
            </td>
          ),
          
          // Links
          a: ({children, href}) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`underline hover:no-underline ${
                isUserMessage ? 'text-white/90 hover:text-white' : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {children}
            </a>
          ),
          
          // Strong/Bold
          strong: ({children}) => (
            <strong className={`font-bold ${isUserMessage ? 'text-white' : 'text-black'}`}>
              {children}
            </strong>
          ),
          
          // Emphasis/Italic
          em: ({children}) => (
            <em className={`italic ${isUserMessage ? 'text-white' : 'text-black'}`}>
              {children}
            </em>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className={`my-3 border-t ${
              isUserMessage ? 'border-white/30' : 'border-black/20'
            }`} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 
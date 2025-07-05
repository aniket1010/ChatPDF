'use client';

import { useState } from 'react';
import { Menu, X, Upload, FileText, Sparkles } from 'lucide-react';

export default function HomePage() {
  const handleUploadClick = () => {
    // TODO: Implement upload modal or redirect to upload page
    // For now, just log the action
    console.log('Upload new PDF clicked');
    // Future: router.push('/upload') or open upload modal
  };

  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#F9F4EB] via-white to-[#FCDCA6]/20 p-6">
      <div className="text-center max-w-lg w-full animate-fade-in">
        {/* Hero Icon */}
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-pink-200 to-amber-200 rounded-3xl flex items-center justify-center shadow-lg">
          <div className="relative">
            <FileText className="w-12 h-12 text-gray-700" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-300 rounded-full flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-gray-700" />
            </div>
          </div>
        </div>
        
        {/* Main Heading */}
        <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
          Welcome to <span className="bg-gradient-to-r from-pink-400 to-amber-400 bg-clip-text text-transparent">ChatPDF</span>
        </h2>
        
        {/* Subtitle */}
        <p className="text-gray-600 mb-8 leading-relaxed text-lg">
          Transform your PDF documents into interactive conversations. 
          Upload, analyze, and chat with your documents using AI.
        </p>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-white/60 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="w-8 h-8 bg-pink-200 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Upload className="w-4 h-4 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Upload</h3>
            <p className="text-xs text-gray-600 mt-1">Drag & drop your PDFs</p>
          </div>
          
          <div className="p-4 bg-white/60 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-4 h-4 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Analyze</h3>
            <p className="text-xs text-gray-600 mt-1">AI-powered insights</p>
          </div>
          
          <div className="p-4 bg-white/60 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="w-8 h-8 bg-pink-200 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText className="w-4 h-4 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">Chat</h3>
            <p className="text-xs text-gray-600 mt-1">Ask questions naturally</p>
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="space-y-4">
          <button 
            onClick={handleUploadClick}
            className="w-full btn-primary py-4 px-8 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            <Upload className="w-5 h-5 mr-3 inline transition-transform duration-200 group-hover:scale-110" />
            Upload New PDF
          </button>
          
          <p className="text-sm text-gray-500">
            Get started by uploading a PDF document and asking questions about it
          </p>
        </div>

        {/* Stats or Additional Info */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Fast</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

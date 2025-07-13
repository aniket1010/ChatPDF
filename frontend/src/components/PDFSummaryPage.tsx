"use client"

import { useState, useEffect } from "react"
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { getConversationSummary, generateConversationSummary } from "@/services/api"
import HtmlRenderer from "./HtmlRenderer"
import { stripPdfExtension } from "@/lib/utils"

interface SummaryData {
  id: string
  title: string
  fileName: string
  summary: string | null
  keyFindings: string | null
  originalSummary?: string
  originalKeyFindings?: string
  summaryContentType?: string
  createdAt: string
}

interface PDFSummaryPageProps {
  conversationId: string
}

export default function PDFSummaryPage({ conversationId }: PDFSummaryPageProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getConversationSummary(conversationId)
      setSummaryData(data)
    } catch (err) {
      console.error("Failed to load summary:", err)
      setError(err instanceof Error ? err.message : "Failed to load summary. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateSummary = async () => {
    setRegenerating(true)
    setError(null)
    try {
      const data = await generateConversationSummary(conversationId)
      setSummaryData(data)
    } catch (err) {
      console.error("Failed to regenerate summary:", err)
      setError(err instanceof Error ? err.message : "Failed to regenerate summary. Please try again.")
    } finally {
      setRegenerating(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [conversationId])

  const formatKeyFindings = (text: string | null): string[] => {
    if (!text) return []
    return text
      .split("\n")
      .map((line) => line.trim().replace(/^[•\-*]\s*/, ""))
      .filter(Boolean)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#F9F4EB" }}>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-16 h-16 border-4 border-black/10 border-t-black rounded-full mx-auto mb-6"
          />
          <p className="text-black/60 text-xl font-light">Analyzing document...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#F9F4EB" }}>
        <motion.div
          className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md w-full border-2 border-black"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertTriangle className="w-12 h-12 text-black/40 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-2">Something went wrong</h2>
          <p className="text-black/60 mb-6">{error}</p>
          <Button onClick={loadSummary} className="bg-black hover:bg-black/80 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      </div>
    )
  }

  if (!summaryData) return null

  const keyFindings = formatKeyFindings(summaryData.keyFindings)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F4EB" }}>
      <AnimatePresence>
        {regenerating && (
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-lg p-6 shadow-2xl border-2 border-black">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
                <span className="text-black font-medium">Regenerating analysis...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

             <div className="h-full flex flex-col max-w-6xl mx-auto">
         {/* Document Container */}
         <div className="m-4 mb-0 bg-white border-2 border-black border-b-0 flex flex-col min-h-[calc(100vh-4rem)]">
          {/* Header Section */}
          <motion.div
            className="text-center pt-8 pb-4 px-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >

                         <motion.h1
               className="text-4xl md:text-5xl lg:text-6xl font-bold text-black tracking-wider leading-tight mb-6"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.4 }}
             >
               {stripPdfExtension(summaryData.fileName).replace(/_/g, " ")}
             </motion.h1>


            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }}>
              <Button
                onClick={handleRegenerateSummary}
                disabled={regenerating}
                className="bg-black hover:bg-black/80 text-white px-6 py-2 text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
                {regenerating ? "REGENERATING..." : "REGENERATE"}
              </Button>
            </motion.div>
          </motion.div>

          {/* Content Section */}
          <div className="flex-1 px-4 pb-4 space-y-4">
            {/* Summary Section */}
            <motion.div
              className="border-2 border-black p-6"
              style={{ backgroundColor: "#C0C9EE" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <h2 className="text-xl font-bold text-black mb-4 tracking-wide">SUMMARY</h2>
              <div className="text-black/80 leading-relaxed text-sm">
                <HtmlRenderer 
                  content={summaryData.summary || ''}
                  contentType={summaryData.summaryContentType as any || 'text'}
                  className="summary-content"
                />
              </div>
            </motion.div>

            {/* Key Findings Section */}
            <motion.div
              className="border-2 border-black p-6 bg-white"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              <h2 className="text-xl font-bold text-black mb-6 tracking-wide">KEY FINDINGS</h2>
              <div className="space-y-3">
                {keyFindings.map((finding, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
                  >
                    <span className="text-black font-bold mt-1">→</span>
                    <div className="text-black/80 text-sm font-medium tracking-wide">
                      <HtmlRenderer 
                        content={finding}
                        contentType={summaryData.summaryContentType as any || 'text'}
                        className="finding-content"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

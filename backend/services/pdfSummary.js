const { askGpt } = require('./gpt');

/**
 * Generate a comprehensive summary of PDF content
 * @param {string} fullText - Complete text content of the PDF
 * @param {string} title - Title/filename of the PDF
 * @returns {Object} - Summary object with abstract, keyFindings, introduction, and tableOfContents
 */
async function generatePDFSummary(fullText, title) {
  try {
    console.log('Generating PDF summary for:', title);
    console.log('Text length:', fullText.length);

    // Extract first portion of text for better context (first ~3000 characters)
    const introText = fullText.substring(0, 3000);
    
    // Generate Abstract/Summary
    const abstractPrompt = `
Please provide a comprehensive abstract/summary of this document titled "${title}".
Focus on the main purpose, scope, and overall conclusions.
Keep it concise but informative (2-3 paragraphs).

Document content:
${introText}
    `;
    
    const summary = await askGpt(abstractPrompt, fullText.substring(0, 2000));

    // Generate Key Findings
    const keyFindingsPrompt = `
Based on this document titled "${title}", please extract and list the key findings, main points, or important conclusions.
Format as bullet points. Focus on actionable insights and important discoveries.

Document content:
${introText}
    `;
    
    const keyFindings = await askGpt(keyFindingsPrompt, fullText.substring(0, 2000));

    // Generate Introduction Overview
    const introPrompt = `
Please provide an introduction overview for this document titled "${title}".
Explain what the document is about, its purpose, and what readers can expect to learn.
Keep it engaging and informative (1-2 paragraphs).

Document content:
${introText}
    `;
    
    const introduction = await askGpt(introPrompt, fullText.substring(0, 2000));

    // Try to extract Table of Contents (if available)
    const tocPrompt = `
Please extract the table of contents or main sections from this document titled "${title}".
If no clear table of contents exists, create a logical outline of the main sections/topics covered.
Format as a numbered or bulleted list.

Document content:
${introText}
    `;
    
    const tableOfContents = await askGpt(tocPrompt, fullText.substring(0, 2000));

    return {
      summary: summary.trim(),
      keyFindings: keyFindings.trim(),
      introduction: introduction.trim(),
      tableOfContents: tableOfContents.trim()
    };

  } catch (error) {
    console.error('Error generating PDF summary:', error);
    throw new Error('Failed to generate PDF summary');
  }
}

/**
 * Generate a quick summary for existing PDFs that don't have summaries
 * @param {string} textChunks - Array of text chunks from the PDF
 * @param {string} title - Title/filename of the PDF
 * @returns {Object} - Summary object
 */
async function generateQuickSummary(textChunks, title) {
  try {
    // Combine first few chunks for context
    const contextText = textChunks.slice(0, 3).join('\n\n');
    
    const quickPrompt = `
Please provide a brief summary of this document titled "${title}".
Include:
1. Main topic/purpose (1-2 sentences)
2. Key points (3-5 bullet points)
3. Document type/category

Content:
${contextText}
    `;
    
    const quickSummary = await askGpt(quickPrompt, contextText);
    
    return {
      summary: quickSummary.trim(),
      keyFindings: 'Key findings will be generated when you first view this document.',
      introduction: `This document "${title}" contains important information. A detailed introduction will be generated when you access the summary page.`,
      tableOfContents: 'Table of contents will be extracted when you first view this document.'
    };

  } catch (error) {
    console.error('Error generating quick summary:', error);
    return {
      summary: `This is a document titled "${title}". Summary will be generated when you first access it.`,
      keyFindings: 'Key findings will be available after processing.',
      introduction: 'Introduction will be generated automatically.',
      tableOfContents: 'Table of contents will be extracted automatically.'
    };
  }
}

module.exports = {
  generatePDFSummary,
  generateQuickSummary
}; 
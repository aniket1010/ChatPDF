const { askGpt } = require('./gpt');

/**
 * Enforce exact word limit for text
 * @param {string} text - Input text
 * @param {number} wordLimit - Exact number of words required
 * @returns {string} - Text with exactly the specified number of words
 */
function enforceWordLimit(text, wordLimit) {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === wordLimit) {
    return text;
  } else if (words.length > wordLimit) {
    // Truncate to exact word limit
    return words.slice(0, wordLimit).join(' ');
  } else {
    // If less than required, return as is (this shouldn't happen with good prompts)
    console.warn(`Generated text has ${words.length} words, expected ${wordLimit}`);
    return text;
  }
}

/**
 * Enforce exact number of key findings
 * @param {string} text - Input text with bullet points
 * @param {number} findingsLimit - Exact number of findings required
 * @returns {string} - Text with exactly the specified number of findings
 */
function enforceKeyFindingsLimit(text, findingsLimit) {
  // Split by lines and find bullet points
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Find lines that start with bullet points or numbers
  const findings = lines.filter(line => 
    line.startsWith('•') || 
    line.startsWith('-') || 
    line.startsWith('*') ||
    /^\d+\./.test(line) // matches "1.", "2.", etc.
  );
  
  console.log(`Found ${findings.length} findings, enforcing exactly ${findingsLimit}`);
  
  if (findings.length === findingsLimit) {
    return findings.join('\n');
  } else if (findings.length > findingsLimit) {
    // Take only the first N findings and log the truncation
    console.log(`Truncating ${findings.length} findings to ${findingsLimit}`);
    return findings.slice(0, findingsLimit).join('\n');
  } else {
    // If less than required, this shouldn't happen with strict prompts
    console.warn(`Generated only ${findings.length} findings, expected ${findingsLimit}. This indicates the AI didn't follow instructions.`);
    
    // Return what we have rather than padding with generic text
    if (findings.length > 0) {
      return findings.join('\n');
    } else {
      // Last resort: create exactly the required number of findings
      const fallbackFindings = [];
      for (let i = 1; i <= findingsLimit; i++) {
        fallbackFindings.push(`• Key finding ${i} will be extracted from document analysis.`);
      }
      return fallbackFindings.join('\n');
    }
  }
}

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
    
    // Generate 50-60 word Summary
    const abstractPrompt = `
You must write a summary of this document titled "${title}" that is STRICTLY between 50-60 words.

CRITICAL REQUIREMENTS:
- Count every single word carefully
- Must be between 50-60 words (minimum 50, maximum 60)
- Focus on main purpose and key conclusions only
- Professional and clear tone
- Use concise, impactful sentences
- NO filler words or unnecessary phrases
- Stop immediately once you reach 50-60 words

Document content:
${introText}

Write a summary between 50-60 words ONLY:
    `;
    
    let summary = await askGpt(abstractPrompt, fullText.substring(0, 2000));
    
    // Enforce word limit between 50-60 words
    summary = summary.trim();
    const wordCount = summary.split(/\s+/).filter(word => word.length > 0).length;
    
    if (wordCount < 50) {
      console.warn(`Summary has ${wordCount} words, minimum is 50. Regenerating...`);
      // Try again with more specific prompt
      const retryPrompt = `
Write a summary of "${title}" in EXACTLY 55 words. Focus on key points and conclusions.
Content: ${introText.substring(0, 1000)}
      `;
      summary = await askGpt(retryPrompt, fullText.substring(0, 1000));
      summary = enforceWordLimit(summary.trim(), 55);
    } else if (wordCount > 60) {
      // Truncate to 60 words maximum
      summary = enforceWordLimit(summary, 60);
    }

    // Generate 5 Key Findings
    const keyFindingsPrompt = `
Extract EXACTLY 5 key findings from this document titled "${title}".

STRICT REQUIREMENTS:
- Must be exactly 5 bullet points (not 3, not 4, not 6, not 7 - EXACTLY 5)
- Each point should be concise (1 sentence maximum)
- Focus ONLY on the most critical insights and conclusions
- Format each as: "• [finding text]"
- NO sub-points, NO nested lists, NO additional explanations
- Count your bullet points: 1, 2, 3, 4, 5 - then STOP
- Each finding should be distinct and valuable

Document content:
${introText}

Provide exactly 5 key findings (count them as you write):
    `;
    
    let keyFindings = await askGpt(keyFindingsPrompt, fullText.substring(0, 2000));
    
    // Check if we got exactly 5 findings, retry if not
    const initialFindings = keyFindings.trim();
    const findingsCount = (initialFindings.match(/^[•\-\*]|\d+\./gm) || []).length;
    
    if (findingsCount !== 5) {
      console.log(`First attempt generated ${findingsCount} findings, retrying for exactly 5...`);
      
      const retryPrompt = `
URGENT: You MUST provide exactly 5 key findings. No more, no less.

Document: "${title}"
Content: ${introText.substring(0, 1500)}

Format EXACTLY like this:
• Finding 1 text here
• Finding 2 text here  
• Finding 3 text here
• Finding 4 text here
• Finding 5 text here

Provide exactly 5 bullet points:
      `;
      
      keyFindings = await askGpt(retryPrompt, fullText.substring(0, 1500));
    }
    
    // Ensure exactly 5 key findings
    keyFindings = enforceKeyFindingsLimit(keyFindings.trim(), 5);

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
const DOMPurify = require('isomorphic-dompurify');

// Dynamic import for marked (ES module)
let marked = null;

/**
 * Initialize marked library
 */
async function initializeMarked() {
  if (!marked) {
    const markedModule = await import('marked');
    marked = markedModule.marked;
  }
  return marked;
}



/**
 * Process and format message content
 * @param {string} content - Raw message content
 * @param {string} role - Message role ('user' or 'assistant')
 * @returns {Object} - Processed message data
 */
async function processMessageContent(content, role = 'assistant') {
  try {
    // Detect if content is likely markdown
    const hasMarkdownIndicators = /(?:\*\*|__|\*|_|`|#{1,6}\s|>\s|\[.*\]\(.*\)|\n\s*[-*+]\s|\n\s*\d+\.\s)/.test(content);
    
    let processedContent = {
      original: content,
      formatted: content,
      contentType: 'text',
      processedAt: new Date()
    };
    
    // Only process assistant messages or content that looks like markdown
    if (role === 'assistant' || hasMarkdownIndicators) {
      try {
        // Initialize marked library
        const markedInstance = await initializeMarked();
        
        // Use marked with basic configuration
        markedInstance.setOptions({
          gfm: true,
          breaks: true,
          pedantic: false,
          sanitize: false, // We'll use DOMPurify instead
          smartLists: true,
          smartypants: true
        });
        
        // Convert markdown to HTML
        const htmlContent = markedInstance(content);
        
        // Sanitize HTML to prevent XSS
        const sanitizedContent = DOMPurify.sanitize(htmlContent, {
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
        
        processedContent = {
          original: content,
          formatted: sanitizedContent,
          contentType: 'html',
          processedAt: new Date()
        };
        
        console.log('Message processed successfully:', {
          role,
          originalLength: content.length,
          formattedLength: sanitizedContent.length,
          hasMarkdown: hasMarkdownIndicators
        });
        
      } catch (markdownError) {
        console.error('Error processing markdown:', markdownError);
        // Fallback to original content if markdown processing fails
        processedContent.contentType = 'text';
      }
    }
    
    return processedContent;
    
  } catch (error) {
    console.error('Error in processMessageContent:', error);
    // Return original content if processing fails
    return {
      original: content,
      formatted: content,
      contentType: 'text',
      processedAt: new Date()
    };
  }
}

/**
 * Process summary content for better formatting
 * @param {Object} summaryData - Raw summary data
 * @returns {Object} - Processed summary data
 */
async function processSummaryContent(summaryData) {
  try {
    const processed = { ...summaryData };
    
    // Process each field that might contain markdown
    const fieldsToProcess = ['summary', 'commonQuestions'];
    
    for (const field of fieldsToProcess) {
      if (processed[field]) {
        const processedField = await processMessageContent(processed[field], 'assistant');
        processed[`${field}Formatted`] = processedField.formatted;
        processed[`${field}ContentType`] = processedField.contentType;
      }
    }
    
    processed.summaryProcessedAt = new Date();
    
    return processed;
    
  } catch (error) {
    console.error('Error processing summary content:', error);
    return summaryData;
  }
}

/**
 * Clean and optimize text content
 * @param {string} text - Raw text content
 * @returns {string} - Cleaned text
 */
function cleanTextContent(text) {
  if (!text) return text;
  
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove multiple consecutive line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Trim whitespace
    .trim();
}

module.exports = {
  processMessageContent,
  processSummaryContent,
  cleanTextContent
}; 
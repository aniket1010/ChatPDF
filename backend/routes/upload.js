const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const prisma = require('../prismaClient');
const { getBatchEmbeddings } = require('../services/embedding');
const { batchUpsertEmbeddings } = require('../services/pinecone');
const { generatePDFSummary } = require('../services/pdfSummary');
const { processSummaryContent } = require('../services/messageProcessor');
const { validatePDF } = require('../middleware/validation');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const path = require('path');
const fs = require('fs');

// Set up Multer disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });
const router = express.Router();

// Initialize LangChain text splitter
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,      // 1000 characters per chunk
  chunkOverlap: 100,    // 100 characters overlap between chunks
  separators: ["\n\n", "\n", ". ", " ", ""], // Try these separators in order
});

router.post('/', upload.single('file'), validatePDF, async (req, res) => {
  console.log('\n📤 === PDF UPLOAD STARTED ===');
  let conversation;

  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const mimetype = req.file.mimetype;
    const size = req.file.size;

    console.log('📄 File details:', { originalName, mimetype, size: `${(size / 1024 / 1024).toFixed(2)}MB` });

    // Parse PDF
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer, {
      max: 0, // No page limit
      pagerender: renderPage
    });

    const text = data.text.trim();
    if (!text) {
      return res.status(400).json({ error: 'No text content found in PDF' });
    }
    console.log(`📊 Extracted ${text.length.toLocaleString()} characters of text`);

    // Generate summary in background
    let summaryData = {};
    let processedSummary = {};
    try {
      summaryData = await generatePDFSummary(text, originalName);
      if (summaryData.summary) {
        processedSummary = await processSummaryContent(summaryData);
      }
    } catch (error) {
      console.error('❌ Failed to generate summary, proceeding without it:', error);
    }

    // Create conversation immediately
    conversation = await prisma.conversation.create({
      data: {
        title: originalName,
        fileName: originalName,
        filePath: filePath,
        summary: summaryData.summary || 'Processing PDF...',
        summaryFormatted: processedSummary.summaryFormatted || null,
        commonQuestions: summaryData.commonQuestions || null,
        commonQuestionsFormatted: processedSummary.commonQuestionsFormatted || null,
        summaryContentType: processedSummary.summaryContentType || 'text',
        summaryGeneratedAt: summaryData.summary ? new Date() : null,
        summaryProcessedAt: processedSummary.summaryProcessedAt || null,
        processingStatus: 'pending'
      }
    });

    console.log(`🆔 Created conversation: ${conversation.id}`);
    
    // Return conversation ID immediately
    res.json({ conversationId: conversation.id });

    // Start background processing
    processPdfInBackground(text, conversation.id, originalName);

  } catch (error) {
    console.error('\n❌ === PDF UPLOAD FAILED ===');
    console.error('💥 Error in upload route:', error);
    
    if (conversation && conversation.id) {
      try {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { 
            processingStatus: 'failed',
            summary: 'Processing failed. Please try again.'
          }
        });
      } catch (updateError) {
        console.error('❌ Error updating failed status:', updateError);
      }
    }
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error processing PDF file', details: error.message });
    }
  }
});

// Asynchronous background processing function
async function processPdfInBackground(text, conversationId, originalName) {
    console.log(`\n🔄 [${conversationId}] === BACKGROUND PROCESSING STARTED ===`);
    console.log(`📄 [${conversationId}] Processing: ${originalName}`);
    
    try {
        // Set status to processing
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { processingStatus: 'processing' }
        });

        // Text chunking
        const chunks = await textSplitter.splitText(text);
        console.log(`📊 [${conversationId}] Created ${chunks.length} chunks`);

        // Generate embeddings
        const embeddings = await getBatchEmbeddings(chunks);
        const embeddingResults = embeddings.map((embedding, index) => ({
            embedding,
            chunk: chunks[index],
            index
        }));
        console.log(`🧠 [${conversationId}] Generated ${embeddingResults.length} embeddings`);

        // Upsert to Pinecone
        const vectorDataArray = embeddingResults.map((result) => ({
            id: `${conversationId}-${result.index}`,
            vector: result.embedding,
            text: result.chunk,
            conversationId: conversationId
        }));
        
        await batchUpsertEmbeddings(vectorDataArray);
        console.log(`📤 [${conversationId}] Upserted ${vectorDataArray.length} vectors to Pinecone`);

        // Mark as completed
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { processingStatus: 'completed' }
        });

        console.log(`✅ [${conversationId}] === BACKGROUND PROCESSING COMPLETED ===`);

        // Process any pending messages
        await processPendingMessages(conversationId);

    } catch (error) {
        console.error(`❌ [${conversationId}] Background processing failed:`, error);
        
        try {
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { 
                    processingStatus: 'failed',
                    summary: 'Processing failed. Please try again.'
                }
            });
        } catch (updateError) {
            console.error(`❌ [${conversationId}] Error updating failed status:`, updateError);
        }
    }
}

// Process pending messages when processing completes
async function processPendingMessages(conversationId) {
    try {
        const pendingMessages = await prisma.message.findMany({
            where: {
                conversationId: conversationId,
                status: 'pending',
                role: 'user'
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`📝 [${conversationId}] Processing ${pendingMessages.length} pending messages`);

        for (const message of pendingMessages) {
            try {
                await generateChatResponse(conversationId, message.text);
                
                // Mark message as completed
                await prisma.message.update({
                    where: { id: message.id },
                    data: { status: 'completed' }
                });
            } catch (error) {
                console.error(`❌ [${conversationId}] Error processing pending message ${message.id}:`, error);
                
                // Mark message as failed
                await prisma.message.update({
                    where: { id: message.id },
                    data: { status: 'failed' }
                });
            }
        }
    } catch (error) {
        console.error(`❌ [${conversationId}] Error processing pending messages:`, error);
    }
}

// Generate chat response for a question
async function generateChatResponse(conversationId, question) {
    const { getEmbedding } = require('../services/embedding');
    const { queryEmbedding } = require('../services/pinecone');
    const { askGpt } = require('../services/gpt');
    const { processMessageContent } = require('../services/messageProcessor');

    const questionEmbedding = await getEmbedding(question);
    const matches = await queryEmbedding(questionEmbedding, 3, conversationId);

    const context = matches
        .map(match => match.metadata?.text || '')
        .filter(text => text.trim().length > 0)
        .join('\n\n');

    if (!context) {
        const errorMessage = "I couldn't find any relevant information in the document to answer your question. Please try asking about something else or rephrase your question.";
        const processedError = await processMessageContent(errorMessage, 'assistant');
        
        await prisma.message.create({
            data: { 
                conversationId, 
                role: 'assistant', 
                text: errorMessage,
                formattedText: processedError.formatted,
                contentType: processedError.contentType,
                status: 'completed',
                processedAt: processedError.processedAt
            }
        });
        return;
    }

    const answer = await askGpt(question, context);
    const processedAnswer = await processMessageContent(answer, 'assistant');

    await prisma.message.create({
        data: { 
            conversationId, 
            role: 'assistant', 
            text: answer,
            formattedText: processedAnswer.formatted,
            contentType: processedAnswer.contentType,
            status: 'completed',
            processedAt: processedAnswer.processedAt
        }
    });
}

// PDF page renderer function
function renderPage(pageData) {
    return pageData.getTextContent()
        .then(function(textContent) {
            let lastY, text = '';
            for (let item of textContent.items) {
                if (lastY != item.transform[5] && text) {
                    text += '\n';
                }
                text += item.str;
                lastY = item.transform[5];
            }
            return text;
        });
}

module.exports = router;

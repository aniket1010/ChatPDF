const express = require('express');
const prisma = require('../prismaClient');
const { deleteEmbeddings } = require('../services/pinecone');
const { generatePDFSummary } = require('../services/pdfSummary');
const { processSummaryContent } = require('../services/messageProcessor');
const fs = require('fs');

const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching conversations');
  }
});

router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching messages');
  }
});

router.get('/:conversationId/details', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error('Error fetching conversation details:', error);
    res.status(500).json({ error: 'Error fetching conversation details' });
  }
});

router.delete('/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;

        // First, check if the conversation exists
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conversation) {
            return res.status(404).json({
                error: 'Conversation not found',
                details: `No conversation exists with ID: ${conversationId}`
            });
        }

        // Delete all messages for this conversation
        await prisma.message.deleteMany({
            where: { conversationId }
        });

        // Delete the conversation itself
        await prisma.conversation.delete({
            where: { id: conversationId }
        });

        // Try to delete embeddings, but don't fail if it errors
        try {
            await deleteEmbeddings(conversationId);
        } catch (pineconeError) {
            console.error('Warning: Failed to delete Pinecone embeddings:', pineconeError);
            // Continue execution even if Pinecone deletion fails
        }

        // Try to delete the PDF file, but don't fail if it errors
        try {
            if (conversation.filePath && fs.existsSync(conversation.filePath)) {
                fs.unlinkSync(conversation.filePath);
                console.log('PDF file deleted successfully:', conversation.filePath);
            }
        } catch (fileError) {
            console.error('Warning: Failed to delete PDF file:', fileError);
            // Continue execution even if file deletion fails
        }

        res.json({ 
            message: 'Conversation, messages, and PDF file deleted successfully',
            warning: 'Note: Some vector embeddings might remain in Pinecone',
            deletedConversation: conversation
        });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ 
            error: 'Error deleting conversation', 
            details: error.message 
        });
    }
});

router.patch('/:conversationId/rename', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { newTitle } = req.body;

    // Validate input
    if (!newTitle || typeof newTitle !== 'string' || !newTitle.trim()) {
      return res.status(400).json({ error: 'Invalid or missing newTitle' });
    }

    // First check if the conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        details: `No conversation exists with ID: ${conversationId}`
      });
    }

    // If conversation exists, update it
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: newTitle.trim() }
    });

    res.json({ 
      message: 'Conversation renamed successfully', 
      conversation: updated 
    });

  } catch (error) {
    console.error('Error renaming conversation:', error);
    res.status(500).json({ 
      error: 'Error renaming conversation', 
      details: error.message 
    });
  }
});

// Get summary for a conversation
router.get('/:conversationId/summary', async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log('Fetching summary for conversation:', conversationId);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        title: true,
        fileName: true,
        summary: true,
        summaryFormatted: true,
        commonQuestions: true,
        commonQuestionsFormatted: true,
        summaryContentType: true,
        summaryGeneratedAt: true,
        summaryProcessedAt: true,
        createdAt: true
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // If no summary exists, return a message indicating it needs to be generated
    if (!conversation.summary) {
      return res.json({
        ...conversation,
        summary: null,
        needsGeneration: true,
        message: 'Summary not yet generated for this document'
      });
    }

    // Return formatted content if available, otherwise return original
    const responseData = {
      ...conversation,
      summary: conversation.summaryFormatted || conversation.summary,
      commonQuestions: conversation.commonQuestionsFormatted || conversation.commonQuestions,
      originalSummary: conversation.summary,
      originalCommonQuestions: conversation.commonQuestions
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ 
      error: 'Error fetching summary',
      details: error.message 
    });
  }
});

// Generate or regenerate summary for a conversation
router.post('/:conversationId/summary/generate', async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log('Generating summary for conversation:', conversationId);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.filePath || !fs.existsSync(conversation.filePath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    // Read and parse the PDF to get text content
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(conversation.filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text.trim();

    if (!text) {
      return res.status(400).json({ error: 'No text content found in PDF' });
    }

    // Generate summary
    const summaryData = await generatePDFSummary(text, conversation.fileName);

    // Process summary content for formatting
    const processedSummary = await processSummaryContent(summaryData);

    // Update conversation with summary and formatted content
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        summary: summaryData.summary,
        summaryFormatted: processedSummary.summaryFormatted,
        commonQuestions: summaryData.commonQuestions,
        commonQuestionsFormatted: processedSummary.commonQuestionsFormatted,
        summaryContentType: processedSummary.summaryContentType || 'html',
        summaryGeneratedAt: new Date(),
        summaryProcessedAt: processedSummary.summaryProcessedAt
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        summary: true,
        summaryFormatted: true,
        commonQuestions: true,
        commonQuestionsFormatted: true,
        summaryContentType: true,
        summaryGeneratedAt: true,
        summaryProcessedAt: true,
        createdAt: true
      }
    });

    // Return formatted content for frontend
    const responseData = {
      ...updatedConversation,
      summary: updatedConversation.summaryFormatted || updatedConversation.summary,
      commonQuestions: updatedConversation.commonQuestionsFormatted || updatedConversation.commonQuestions,
      originalSummary: updatedConversation.summary,
      originalCommonQuestions: updatedConversation.commonQuestions
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Error generating summary',
      details: error.message 
    });
  }
});

// Serve the PDF file for a conversation
router.get('/:conversationId/pdf', async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log('Fetching PDF for conversation:', conversationId);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      console.log('Conversation not found:', conversationId);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!conversation.filePath) {
      console.log('No file path found for conversation:', conversationId);
      return res.status(404).json({ error: 'PDF file not found' });
    }

    console.log('Serving PDF from path:', conversation.filePath);
    
    // Check if file exists
    if (!fs.existsSync(conversation.filePath)) {
      console.log('File does not exist at path:', conversation.filePath);
      return res.status(404).json({ error: 'PDF file not found on server' });
    }

    // Set proper headers for PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${conversation.fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type');
    
    res.sendFile(conversation.filePath);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ 
      error: 'Error serving PDF',
      details: error.message 
    });
  }
});

module.exports = router;

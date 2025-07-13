const express = require('express');
const { getEmbedding } = require('../services/embedding');
const { queryEmbedding } = require('../services/pinecone');
const { askGpt } = require('../services/gpt');
const { processMessageContent, cleanTextContent } = require('../services/messageProcessor');
const prisma = require('../prismaClient');

const router = express.Router();

// Get messages for a conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages for the conversation
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    // Transform messages to frontend format
    const formattedMessages = messages.map(message => ({
      id: message.id,
      text: message.formattedText || message.text,
      originalText: message.text,
      contentType: message.contentType || 'text',
      isUser: message.role === 'user',
      timestamp: message.createdAt,
      processedAt: message.processedAt
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Error fetching messages' });
  }
});

// Post a new message to a conversation
router.post('/:conversationId', async (req, res) => {
  try {
    const { question } = req.body;
    const { conversationId } = req.params;

    console.log('Received question:', question);

    // Check if conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Clean and process user message
    const cleanedQuestion = cleanTextContent(question);
    const processedUserMessage = await processMessageContent(cleanedQuestion, 'user');

    // Always create the user message
    const userMessage = await prisma.message.create({
      data: { 
        conversationId, 
        role: 'user', 
        text: cleanedQuestion,
        formattedText: processedUserMessage.formatted,
        contentType: processedUserMessage.contentType,
        status: 'completed',
        processedAt: processedUserMessage.processedAt
      }
    });

    // Check if processing is complete
    if (conversation.processingStatus !== 'completed') {
      // Queue the message for later processing
      await prisma.message.update({
        where: { id: userMessage.id },
        data: { status: 'pending' }
      });

      // Return the user message immediately
      return res.json({
        id: userMessage.id,
        text: processedUserMessage.formatted,
        originalText: cleanedQuestion,
        contentType: processedUserMessage.contentType,
        isUser: true,
        timestamp: userMessage.createdAt,
        processedAt: processedUserMessage.processedAt
      });
    }

    // Process the message immediately if embeddings are ready
    const questionEmbedding = await getEmbedding(question);
    const matches = await queryEmbedding(questionEmbedding, 3, conversationId);

    console.log('Found matches:', matches.length);

    // Extract and format the context from matches
    const context = matches
      .map(match => match.metadata?.text || '')
      .filter(text => text.trim().length > 0)
      .join('\n\n');

    console.log('Formatted context:', context);

    if (!context) {
      const errorMessage = "I couldn't find any relevant information in the document to answer your question. Please try asking about something else or rephrase your question.";
      
      // Process error message
      const processedError = await processMessageContent(errorMessage, 'assistant');
      
      const assistantMessage = await prisma.message.create({
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

      return res.json({
        id: assistantMessage.id,
        text: processedError.formatted,
        originalText: errorMessage,
        contentType: processedError.contentType,
        isUser: false,
        timestamp: assistantMessage.createdAt,
        processedAt: processedError.processedAt
      });
    }

    const answer = await askGpt(question, context);

    // Process the AI response
    const processedAnswer = await processMessageContent(answer, 'assistant');

    const assistantMessage = await prisma.message.create({
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

    // Return message in frontend format
    res.json({
      id: assistantMessage.id,
      text: processedAnswer.formatted,
      originalText: answer,
      contentType: processedAnswer.contentType,
      isUser: false,
      timestamp: assistantMessage.createdAt,
      processedAt: processedAnswer.processedAt
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    
    // Create a user-friendly error message
    let errorMessage = "I'm having trouble processing your request right now. Please try again in a moment.";
    
    if (error.message.includes('PineconeConnectionError') || error.message.includes('Connect Timeout Error')) {
      errorMessage = "I'm having trouble connecting to the document database. Please try again in a few minutes.";
    }
    
    // Process error message
    const processedError = await processMessageContent(errorMessage, 'assistant');
    
    const assistantMessage = await prisma.message.create({
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

    return res.json({
      id: assistantMessage.id,
      text: processedError.formatted,
      originalText: errorMessage,
      contentType: processedError.contentType,
      isUser: false,
      timestamp: assistantMessage.createdAt,
      processedAt: processedError.processedAt
    });
  }
});

module.exports = router;

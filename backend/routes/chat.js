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
      text: message.formattedText || message.text, // Use formatted content if available
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

    // Clean and process user message
    const cleanedQuestion = cleanTextContent(question);
    const processedUserMessage = await processMessageContent(cleanedQuestion, 'user');

    const userMessage = await prisma.message.create({
      data: { 
        conversationId, 
        role: 'user', 
        text: cleanedQuestion,
        formattedText: processedUserMessage.formatted,
        contentType: processedUserMessage.contentType,
        processedAt: processedUserMessage.processedAt
      }
    });

    const questionEmbedding = await getEmbedding(question);
    const matches = await queryEmbedding(questionEmbedding, 3, conversationId);

    console.log('Found matches:', matches.length);
    console.log('Matches:', JSON.stringify(matches, null, 2));

    // Extract and format the context from matches
    const context = matches
      .map(match => {
        console.log('Match metadata:', match.metadata);
        return match.metadata?.text || '';
      })
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
    res.status(500).send('Error chatting');
  }
});

module.exports = router;

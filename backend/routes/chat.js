const express = require('express');
const { getEmbedding } = require('../services/embedding');
const { queryEmbedding } = require('../services/pinecone');
const { askGpt } = require('../services/gpt');
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
      text: message.text,
      isUser: message.role === 'user',
      timestamp: message.createdAt
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

    const userMessage = await prisma.message.create({
      data: { conversationId, role: 'user', text: question }
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
      
      const assistantMessage = await prisma.message.create({
        data: { conversationId, role: 'assistant', text: errorMessage }
      });

      return res.json({
        id: assistantMessage.id,
        text: errorMessage,
        isUser: false,
        timestamp: assistantMessage.createdAt
      });
    }

    const answer = await askGpt(question, context);

    const assistantMessage = await prisma.message.create({
      data: { conversationId, role: 'assistant', text: answer }
    });

    // Return message in frontend format
    res.json({
      id: assistantMessage.id,
      text: answer,
      isUser: false,
      timestamp: assistantMessage.createdAt
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    res.status(500).send('Error chatting');
  }
});

module.exports = router;

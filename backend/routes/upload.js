const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const prisma = require('../prismaClient');
const { getEmbedding } = require('../services/embedding');
const { upsertEmbedding } = require('../services/pinecone');
const { generatePDFSummary } = require('../services/pdfSummary');
const { validatePDF } = require('../middleware/validation');
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

router.post('/', upload.single('file'), validatePDF, async (req, res) => {
  try {
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const mimetype = req.file.mimetype;
    const size = req.file.size;

    console.log('File details:', { originalName, mimetype, size, filePath });

    // Parse PDF from disk
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer, {
      max: 0, // No page limit
      pagerender: renderPage
    });

    console.log('PDF parse result:', {
      numPages: data.numpages,
      info: data.info,
      metadata: data.metadata
    });

    const text = data.text.trim();
    if (!text) {
      return res.status(400).json({ error: 'No text content found in PDF' });
    }

    console.log('PDF text length:', text.length);
    console.log('First 500 characters of text:', text.substring(0, 500));

    // Generate PDF summary
    console.log('Generating PDF summary...');
    let summaryData = {};
    try {
      summaryData = await generatePDFSummary(text, originalName);
      console.log('PDF summary generated successfully');
    } catch (error) {
      console.error('Failed to generate summary, proceeding without it:', error);
    }

    // Save conversation with file path and summary
    const conversation = await prisma.conversation.create({
      data: {
        title: originalName,
        fileName: originalName,
        filePath: filePath,
        summary: summaryData.summary || null,
        keyFindings: summaryData.keyFindings || null,
        introduction: summaryData.introduction || null,
        tableOfContents: summaryData.tableOfContents || null,
        summaryGeneratedAt: summaryData.summary ? new Date() : null
      }
    });
    console.log('Created conversation:', conversation.id);

    const chunks = splitTextIntoChunks(text);
    console.log('Number of chunks:', chunks.length);
    console.log('Sample chunk content:', chunks[0]);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      console.log('Chunk length:', chunk.length);
      console.log('Chunk content:', chunk);

      const embedding = await getEmbedding(chunk);
      await upsertEmbedding(embedding, `${conversation.id}-${i}`, chunk, conversation.id);
      console.log(`Successfully processed chunk ${i + 1}`);
    }

    res.json({ conversationId: conversation.id });
  } catch (error) {
    console.error('Error in upload route:', error);
    res.status(500).json({ error: 'Error processing PDF file', details: error.message });
  }
});

// Custom page renderer to ensure text extraction
async function renderPage(pageData) {
  const renderOptions = {
    normalizeWhitespace: true,
    disableCombineTextItems: false
  };
  return pageData.getTextContent(renderOptions)
    .then(textContent => {
      return textContent.items.map(item => item.str).join(' ');
    });
}

function splitTextIntoChunks(text) {
  // Clean the text first
  const cleanedText = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace

  const chunkSize = 1000; // characters
  const chunks = [];
  
  // Split by paragraphs first, then by chunk size
  const paragraphs = cleanedText.split(/\n\s*\n/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      // If a single paragraph is larger than chunkSize, split it
      if (paragraph.length > chunkSize) {
        for (let i = 0; i < paragraph.length; i += chunkSize) {
          chunks.push(paragraph.slice(i, i + chunkSize).trim());
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      if (currentChunk) currentChunk += '\n\n';
      currentChunk += paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

module.exports = router;

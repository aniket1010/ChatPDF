const { validateFileSize, validateFileType } = require('../utils/validators');

const validatePDF = (req, res, next) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    // Validate file type
    if (!validateFileType(req.file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only PDF files are allowed' 
      });
    }

    // Validate file size
    if (!validateFileSize(req.file.size)) {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB' 
      });
    }

    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Error validating file', 
      details: error.message 
    });
  }
};

const validateConversationId = (req, res, next) => {
  const { conversationId } = req.params;
  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid conversation ID' 
    });
  }
  next();
};

module.exports = {
  validatePDF,
  validateConversationId
};

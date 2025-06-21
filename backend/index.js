const express = require('express');
const cors = require('cors');
const { validatePDF } = require('./middleware/validation');

const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');
const conversationRoutes = require('./routes/conversation');

require('dotenv').config();

const app = express();

app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(express.json());


// Routes
app.use('/upload', uploadRoutes);
app.use('/chat', chatRoutes);
app.use('/conversation', conversationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

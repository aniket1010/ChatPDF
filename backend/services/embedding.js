const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text
  });
  return res.data[0].embedding;
}

module.exports = { getEmbedding };

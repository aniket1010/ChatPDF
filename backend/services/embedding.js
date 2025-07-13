const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text) {
  const startTime = Date.now();
  
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small', // Changed to 3-small for 1536 dimensions
    input: text
  });
  
  const endTime = Date.now();
  console.log(`Embedding generation took: ${endTime - startTime}ms`);
  
  return res.data[0].embedding;
}

// New batch embedding function for better performance
async function getBatchEmbeddings(texts) {
  const startTime = Date.now();
  
  if (!texts || texts.length === 0) {
    return [];
  }
  
  // OpenAI supports up to 2048 inputs per request, but we'll use 100 for better rate limit handling
  const batchSize = 100;
  const allEmbeddings = [];
  
  // Create batches
  const batches = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }
  
  // Process batches concurrently (max 3 concurrent to avoid rate limits)
  const maxConcurrent = 3;
  
  for (let i = 0; i < batches.length; i += maxConcurrent) {
    const concurrentBatches = batches.slice(i, i + maxConcurrent);
    
    const batchPromises = concurrentBatches.map(async (batch, batchIndex) => {
      const globalBatchIndex = i + batchIndex;
      
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch
      });
      
      return res.data.map(item => item.embedding);
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(batchEmbeddings => {
      allEmbeddings.push(...batchEmbeddings);
    });
  }
  
  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  const avgTimePerText = ((endTime - startTime) / texts.length).toFixed(2);
  
  console.log(`🧠 [Embeddings] Generated ${allEmbeddings.length} embeddings in ${totalTime}s (${Math.round(texts.length / totalTime)} texts/sec)`);
  
  return allEmbeddings;
}

module.exports = { getEmbedding, getBatchEmbeddings };

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askGpt(prompt, context) {
  console.log('Context being sent to GPT:', context);
  
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant that answers questions based on the provided context. If the context doesn't contain relevant information, say so."
    },
    {
      role: "user",
      content: `Context: ${context}\n\nQuestion: ${prompt}\n\nPlease provide a detailed answer based on the context above. If the context doesn't contain relevant information, please say so.`
    }
  ];

  const res = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: messages,
    temperature: 0.7,
    max_tokens: 500
  });
  
  return res.choices[0].message.content;
}

module.exports = { askGpt };

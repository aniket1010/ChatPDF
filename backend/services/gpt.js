const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function askGpt(prompt, context) {
  console.log('Context being sent to GPT:', context);
  
  const messages = [
    {
      role: "system",
      content: `You are a helpful document analysis assistant. Follow these guidelines:

FORMATTING RULES:
- Use clear, well-structured markdown formatting
- Use **bold** for important terms and concepts
- Use bullet points (-) for lists and key points
- Use numbered lists (1., 2., etc.) for step-by-step processes
- Use \`code\` formatting for technical terms, file names, or specific values
- Use > blockquotes for important quotes or highlighted information
- Keep paragraphs concise and focused
- Use headings (## or ###) to organize longer responses

CONTENT RULES:
- Answer questions based strictly on the provided context
- If information isn't in the context, clearly state "This information is not available in the provided document"
- Be precise and specific in your answers
- Include relevant details and examples when available
- Maintain a professional, helpful tone
- Avoid speculation or information not found in the context`
    },
    {
      role: "user",
      content: `**Document Context:**
${context}

**User Question:** ${prompt}

Please analyze the document context and provide a comprehensive answer to the user's question. Use proper markdown formatting to make your response clear and easy to read.`
    }
  ];

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0.7,
    max_tokens: 800,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1
  });
  
  return res.choices[0].message.content;
}

module.exports = { askGpt };

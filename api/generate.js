import { generateGeminiText } from '../server/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const text = await generateGeminiText({
      systemPrompt: body?.systemPrompt || '',
      userMessage: body?.userMessage || '',
      conversationHistory: body?.conversationHistory || [],
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY,
    });

    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unexpected server error' });
  }
}

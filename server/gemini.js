const DEFAULT_MODEL = 'gemini-2.5-flash';

function normalizeConversationHistory(conversationHistory = []) {
  return conversationHistory
    .filter((msg) => msg?.content)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
}

function extractResponseText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text || '')
    .join('')
    .trim();
}

export async function generateGeminiText({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = DEFAULT_MODEL,
  apiKey,
}) {
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY. Add it to your local environment or Vercel project settings.');
  }

  const contents = [
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'Gemini API request failed';
    throw new Error(message);
  }

  const text = extractResponseText(data);
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

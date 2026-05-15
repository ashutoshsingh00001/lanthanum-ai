const DEFAULT_MODEL = 'google/gemini-2.5-flash';

function normalizeConversationHistory(conversationHistory = []) {
  return conversationHistory
    .filter((msg) => msg?.content)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}

export async function generateOpenRouterText({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = DEFAULT_MODEL,
  apiKey,
}) {
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY. Add it to your .env file.');
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:5173', // Optional, for including your app on openrouter.ai rankings.
      'X-Title': 'Lanthanum AI', // Optional. Shows in rankings on openrouter.ai.
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'OpenRouter API request failed';
    throw new Error(message);
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('OpenRouter returned an empty response');
  }

  return text;
}

const DEFAULT_MODEL = 'qwen-3-235b-a22b-instruct-2507';

function normalizeConversationHistory(conversationHistory = []) {
  return conversationHistory
    .filter((msg) => msg?.content)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}

export async function generateCerebrasText({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = DEFAULT_MODEL,
  apiKey,
}) {
  if (!apiKey) {
    throw new Error('Missing CEREBRAS_API_KEY. Add it to your .env file.');
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
    const message = data?.error?.message || data?.message || data?.detail || JSON.stringify(data) || 'Cerebras API request failed';
    throw new Error(message);
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Cerebras returned an empty response');
  }

  return text;
}

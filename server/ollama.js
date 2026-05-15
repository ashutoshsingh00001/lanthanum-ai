const DEFAULT_MODEL = 'gemma4:31b-cloud';
const DEFAULT_BASE_URL = 'http://localhost:11434';

function normalizeConversationHistory(conversationHistory = []) {
  return conversationHistory
    .filter((msg) => msg?.content)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}

export async function generateOllamaText({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = DEFAULT_MODEL,
  baseUrl = DEFAULT_BASE_URL,
}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || data?.error || 'Ollama API request failed');

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Ollama returned an empty response');

  return text;
}

export async function streamOllamaText({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = DEFAULT_MODEL,
  baseUrl = DEFAULT_BASE_URL,
}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || errorData?.error || 'Ollama streaming request failed');
  }

  return response.body;
}

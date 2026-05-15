const DEFAULT_MODEL = 'moonshotai/kimi-k2-instruct';

function normalizeConversationHistory(conversationHistory = []) {
  return conversationHistory
    .filter((msg) => msg?.content)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}

export async function generateNvidiaNimText({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = DEFAULT_MODEL,
  apiKey,
}) {
  if (!apiKey) throw new Error('Missing NVIDIA_NIM_API_KEY. Add it to your .env file.');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 8192,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || data?.detail || 'NVIDIA NIM API request failed');
  
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('NVIDIA NIM returned an empty response');

  return text;
}

export async function streamNvidiaNimText({
  systemPrompt,
  userMessage,
  conversationHistory = [],
  model = DEFAULT_MODEL,
  apiKey,
}) {
  if (!apiKey) throw new Error('Missing NVIDIA_NIM_API_KEY. Add it to your .env file.');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 8192,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('NVIDIA NIM API error:', response.status, JSON.stringify(errorData, null, 2));
    throw new Error(errorData?.error?.message || errorData?.detail || `NVIDIA NIM API streaming request failed (${response.status})`);
  }

  // Return the raw readable stream
  return response.body;
}

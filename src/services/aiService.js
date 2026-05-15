/**
 * AI Service — NVIDIA NIM API
 */

const AI_API_URL = '/api/generate';

import designGuidelines from '../prompts/design-guidelines.md?raw';

const UI_SYSTEM_PROMPT = `${designGuidelines}

FINAL INSTRUCTION:
Generate the requested UI following the guidelines above.
Return ONLY a brief one-sentence description followed by the complete code in a \`\`\`html code block.
Do not include any conversational filler.`;

const AGENT_SYSTEM_PROMPT = `You are an AI design agent that can manipulate a design canvas. You have access to the following tools:

AVAILABLE TOOLS:
1. create_frame(x, y, width, height, title, html) - Create a new design frame with complete HTML document
2. add_rectangle(x, y, width, height, fill, stroke, borderRadius) - Add a rectangle shape
3. add_ellipse(x, y, width, height, fill, stroke) - Add an ellipse/circle shape
4. add_text(x, y, content, fontSize, color, fontWeight) - Add text element
5. move_element(id, x, y) - Move an element to position
6. resize_element(id, width, height) - Resize element
7. delete_element(id) - Delete element
8. change_color(id, color) - Change element fill color
9. generate_ui(prompt) - Generate a complete HTML UI and create a frame
10. select_tool(toolName) - Switch to a specific tool (select, hand, frame, rectangle, ellipse, line, text, pen)

IMPORTANT: When using create_frame or generate_ui, the HTML must be a COMPLETE, self-contained HTML document. Use Tailwind classes and DaisyUI components for premium styling. Focus on modern, high-end aesthetics.

RESPONSE FORMAT:
You MUST respond with a JSON array of tool calls. Each tool call is an object with "tool" and "args" fields.

Example:
\`\`\`json
[
  {"tool": "add_rectangle", "args": {"x": 100, "y": 100, "width": 200, "height": 150, "fill": "#ff6d33", "borderRadius": 12}},
  {"tool": "add_text", "args": {"x": 120, "y": 130, "content": "Hello World", "fontSize": 24, "color": "#FFFFFF"}}
]
\`\`\`

If the user asks something that doesn't need tool calls, respond with a "message" tool:
\`\`\`json
[{"tool": "message", "args": {"text": "Your response here"}}]
\`\`\`

Always respond ONLY with valid JSON wrapped in \`\`\`json code blocks.`;

export function extractHtmlFromResponse(text) {
  const htmlMatch = text.match(/```(?:html|xml)\n?([\s\S]*?)```/i);
  if (htmlMatch) {
    const content = htmlMatch[1].trim();
    if (content.toLowerCase().startsWith('<!doctype') || content.toLowerCase().startsWith('<html')) {
      return content;
    }
  }

  const docMatch = text.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (docMatch) return docMatch[1].trim();

  const htmlTagMatch = text.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTagMatch) return htmlTagMatch[1].trim();

  const tagMatch = text.match(/(<(div|main|section|nav|header|footer)[\s\S]*<\/\2>)/i);
  if (tagMatch) return tagMatch[1].trim();

  return text.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
}

export function extractDescription(text) {
  const parts = text.split('```');
  return parts[0].trim() || 'UI Component';
}

export function extractToolCalls(text) {
  const jsonMatch = text.match(/```json\n?([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error('Failed to parse agent tool calls:', e);
      return null;
    }
  }

  try {
    const trimmed = text.trim();
    if (trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
  } catch (e) {
    // Not JSON
  }

  return null;
}

const PROXY_URL = import.meta.env.VITE_CLAUDE_PROXY_URL || 'http://localhost:8080';
const MODEL = import.meta.env.VITE_CLAUDE_MODEL || 'claude-sonnet-4-6';

function normalizeConversationHistory(conversationHistory = []) {
  return conversationHistory
    .filter((msg) => msg?.content)
    .map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
}

export async function callGemini(systemPrompt, userMessage, conversationHistory = []) {
  const messages = [
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${PROXY_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'test',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || 'AI API request failed');
  }

  const text = data?.content
    ?.filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  if (!text) throw new Error('API returned an empty response');

  return text;
}

export async function* streamGemini(systemPrompt, userMessage, conversationHistory = []) {
  const messages = [
    ...normalizeConversationHistory(conversationHistory),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${PROXY_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'test',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error?.message || data?.message || 'AI API streaming request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const dataStr = line.replace(/^data: /, '');
      if (dataStr.trim() === '[DONE]') continue;

      try {
        const event = JSON.parse(dataStr);
        let chunk = '';

        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          chunk = event.delta.text || '';
        }

        if (chunk) {
          fullContent += chunk;
          yield {
            chunk,
            fullContent,
            done: false,
          };
        }
      } catch (e) {
        // Skip unparseable lines
      }
    }
  }

  yield {
    chunk: '',
    fullContent,
    done: true,
  };
}

export async function generateUI(prompt, conversationHistory = []) {
  const response = await callGemini(UI_SYSTEM_PROMPT, prompt, conversationHistory);
  const html = extractHtmlFromResponse(response);
  const description = extractDescription(response);

  return {
    rawResponse: response,
    html,
    description,
  };
}

export async function executeAgentAction(prompt, conversationHistory = []) {
  const response = await callGemini(AGENT_SYSTEM_PROMPT, prompt, conversationHistory);
  const toolCalls = extractToolCalls(response);

  return {
    rawResponse: response,
    toolCalls,
  };
}

export { UI_SYSTEM_PROMPT, AGENT_SYSTEM_PROMPT };

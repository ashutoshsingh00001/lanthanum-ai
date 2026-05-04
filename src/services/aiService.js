/**
 * AI Service — Gemini API
 */

const AI_API_URL = '/api/generate';

const UI_SYSTEM_PROMPT = `You are a world-class UI/UX designer and elite frontend developer. Your goal is to create STUNNING, premium, and state-of-the-art web interfaces using HTML and Tailwind CSS.

RULES:
1. Always return a COMPLETE, self-contained HTML document starting with <!DOCTYPE html>.
2. Include Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Include DaisyUI and Flowbite if needed for premium components.
4. Use Tailwind config to set up modern fonts (Inter, Outfit).
5. DESIGN PRINCIPLES:
   - Use vibrant, harmonious color palettes (avoid default colors).
   - Use modern patterns: Bento grids, glassmorphism, sleek gradients.
   - Add subtle micro-animations (hover:scale-[1.02], transition-all).
   - Ensure ample whitespace and perfect alignment.
6. Provide a brief one-sentence description of the design before the HTML block.

RESPONSE FORMAT:
A sleek SaaS landing page with a hero section and glassmorphism effect.
\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Outfit:wght@700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            heading: ['Outfit', 'sans-serif'],
          },
        }
      }
    }
  </script>
</head>
<body class="bg-slate-900 text-slate-100 font-sans min-h-screen">
  <!-- UI content here -->
</body>
</html>
\`\`\``;

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

export async function callGemini(systemPrompt, userMessage, conversationHistory = []) {
  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      userMessage,
      conversationHistory,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Gemini API request failed');
  }

  return data.text;
}

export async function* streamGemini(systemPrompt, userMessage, conversationHistory = []) {
  const fullContent = await callGemini(systemPrompt, userMessage, conversationHistory);
  yield {
    chunk: fullContent,
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

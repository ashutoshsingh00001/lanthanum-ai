/**
 * Agent Service — Processes tool calls from the AI agent and dispatches canvas actions
 */
import { extractHtmlFromResponse, callGemini } from './aiService';
import { buildFrameDocument, createDefaultCodeFiles } from '../utils/frameCode';

/**
 * Execute a list of tool calls against the canvas
 */
export async function executeToolCalls(toolCalls, actions) {
  const results = [];

  for (const call of toolCalls) {
    try {
      const result = await executeSingleTool(call, actions);
      results.push({ tool: call.tool, success: true, result });
    } catch (error) {
      results.push({ tool: call.tool, success: false, error: error.message });
    }
  }

  return results;
}

async function executeSingleTool(call, actions) {
  const { tool, args } = call;

  switch (tool) {
    case 'create_frame': {
      // If HTML content is provided directly, use it
      if (args.html) {
        actions.setMainCode({ code: args.html, language: 'html', previewHTML: args.html });
        return `UI updated with provided HTML`;
      }

      const codeFiles = createDefaultCodeFiles({
        html: args.codeFiles?.html || args.content || '<div id="app"></div>',
        css: args.codeFiles?.css || '',
        js: args.codeFiles?.js || '',
        react: args.codeFiles?.react || '',
      });
      const htmlContent = buildFrameDocument(codeFiles);
      actions.setMainCode({ code: htmlContent, language: 'html', previewHTML: htmlContent });
      return `UI updated with generated content`;
    }

    case 'add_rectangle': {
      actions.addShape({
        type: 'rectangle',
        x: args.x || 0,
        y: args.y || 0,
        width: args.width || 100,
        height: args.height || 100,
        fill: args.fill || '#ff6d33',
        stroke: args.stroke || 'none',
        strokeWidth: args.strokeWidth || 0,
        borderRadius: args.borderRadius || 0,
      });
      return `Rectangle added at (${args.x}, ${args.y})`;
    }

    case 'add_ellipse': {
      actions.addShape({
        type: 'ellipse',
        x: args.x || 0,
        y: args.y || 0,
        width: args.width || 100,
        height: args.height || 100,
        fill: args.fill || '#00D4AA',
        stroke: args.stroke || 'none',
        strokeWidth: args.strokeWidth || 0,
      });
      return `Ellipse added at (${args.x}, ${args.y})`;
    }

    case 'add_text': {
      actions.addText({
        x: args.x || 0,
        y: args.y || 0,
        content: args.content || 'Text',
        fontSize: args.fontSize || 16,
        color: args.color || '#E8E8F0',
        fontWeight: args.fontWeight || 400,
      });
      return `Text "${args.content}" added at (${args.x}, ${args.y})`;
    }

    case 'move_element': {
      // Try all element types
      actions.moveFrame(args.id, args.x, args.y);
      actions.moveShape(args.id, args.x, args.y);
      actions.moveText(args.id, args.x, args.y);
      return `Element ${args.id} moved to (${args.x}, ${args.y})`;
    }

    case 'resize_element': {
      actions.resizeFrame(args.id, args.width, args.height);
      return `Element ${args.id} resized to ${args.width}x${args.height}`;
    }

    case 'delete_element': {
      actions.deleteFrame(args.id);
      actions.deleteShape(args.id);
      actions.deleteText(args.id);
      return `Element ${args.id} deleted`;
    }

    case 'change_color': {
      actions.updateShape(args.id, { fill: args.color });
      actions.updateText(args.id, { color: args.color });
      return `Color changed to ${args.color}`;
    }

    case 'generate_ui': {
      const HTML_SYSTEM_PROMPT = `You are a world-class UI/UX designer and elite frontend developer. Generate a COMPLETE, self-contained HTML document for the requested UI.

RULES:
1. Return ONLY valid, complete HTML starting with <!DOCTYPE html>
2. Include Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Include modern fonts and DaisyUI for premium components.
4. DESIGN PRINCIPLES:
   - Use vibrant, harmonious color palettes (avoid default colors).
   - Use modern patterns: Bento grids, glassmorphism, sleek gradients.
   - Add subtle micro-animations (hover:scale-[1.02], transition-all).
   - Ensure ample whitespace, perfect alignment, and high-quality typography.
5. Root element should be a <body> with min-h-screen and a modern background.

RESPONSE FORMAT (only HTML, no explanations):
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated UI</title>
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
</html>`;

      try {
        const htmlContent = await callGemini(HTML_SYSTEM_PROMPT, args.prompt || 'Create a beautiful UI component', []);
        const extractedHtml = extractHtmlFromResponse(htmlContent);

        if (extractedHtml) {
          actions.setMainCode({ code: extractedHtml, language: 'html', previewHTML: extractedHtml });
          return 'UI generated successfully';
        }
        return 'Failed to generate valid HTML';
      } catch (error) {
        return `Error generating UI: ${error.message}`;
      }
    }

    case 'select_tool': {
      actions.setTool(args.toolName);
      return `Switched to ${args.toolName} tool`;
    }

    case 'message': {
      return args.text;
    }

    default:
      return `Unknown tool: ${tool}`;
  }
}

/**
 * Get the list of existing elements for context
 */
export function getCanvasContext(state) {
  const elements = [];

  if (state.mainCode) {
    elements.push({
      type: 'main_code',
      language: state.language,
      content_preview: state.mainCode.substring(0, 500) + '...',
    });
  }

  return elements;
}

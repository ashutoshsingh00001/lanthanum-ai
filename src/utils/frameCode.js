const EMPTY_HTML = `<div id="app"></div>`;

const EMPTY_CSS = `:root {
  font-family: Inter, system-ui, -apple-system, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f7f7fb;
  color: #1f2430;
}`;

const EMPTY_JS = `// Vanilla JS entry
console.log('Frame loaded');
`;

const EMPTY_REACT = `function App() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Hello from React</h1>
      <p style={{ marginTop: 8, color: '#5b6478' }}>
        Edit this file and click Save to rerender.
      </p>
      <button
        onClick={() => setCount(count + 1)}
        style={{ marginTop: 16, padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Count: {count}
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<App />);
`;

export function injectElementIds(html) {
  if (!html) return html;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // If it's not a full document, we might just have a fragment
  // But DOMParser usually wraps it in body
  const body = doc.body;
  let nextId = 1;

  function traverse(el) {
    if (el.nodeType === 1) { // Element node
      if (!el.id) {
        // Create a readable ID based on tag name
        const tag = el.tagName.toLowerCase();
        // Check if there are other elements with same tag to avoid collisions if we just used tag+counter
        // But for simplicity, let's just use a unique prefix
        el.id = `v-${tag}-${nextId++}`;
      }
      for (let i = 0; i < el.children.length; i++) {
        traverse(el.children[i]);
      }
    }
  }

  traverse(body);
  
  // If original was a full document, return full document
  if (html.toLowerCase().includes('<html')) {
    return doc.documentElement.outerHTML;
  }
  
  // Otherwise just return the body content
  return body.innerHTML;
}

export function createDefaultCodeFiles(overrides = {}) {
  return {
    html: overrides.html ?? EMPTY_HTML,
    css: overrides.css ?? EMPTY_CSS,
    js: overrides.js ?? EMPTY_JS,
    react: overrides.react ?? '',
  };
}

export function normalizeCodeFiles(frame) {
  const fromFrame = frame?.codeFiles;
  if (fromFrame && typeof fromFrame === 'object') {
    return createDefaultCodeFiles({
      html: fromFrame.html ?? frame?.content ?? EMPTY_HTML,
      css: fromFrame.css ?? '',
      js: fromFrame.js ?? '',
      react: fromFrame.react ?? '',
    });
  }
  return createDefaultCodeFiles({
    html: frame?.content ?? EMPTY_HTML,
  });
}

export function buildFrameDocument(codeFilesInput) {
  const codeFiles = createDefaultCodeFiles(codeFilesInput);

  // If html is already a complete document, return it as-is
  const htmlContent = codeFiles.html?.trim() || '';
  if (htmlContent.toLowerCase().startsWith('<!doctype') || htmlContent.toLowerCase().startsWith('<html')) {
    // Force inject Tailwind if missing
    if (!htmlContent.includes('cdn.tailwindcss.com')) {
      return htmlContent.replace(/<head>/i, '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
    }
    return htmlContent;
  }

  // Otherwise, build a complete document from separate files
  const usesReact = Boolean(codeFiles.react && codeFiles.react.trim());
  const runtimeScripts = usesReact
    ? `
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  `
    : '';

  const appRoot = htmlContent || '<div id="app"></div>';
  const scriptBody = `${codeFiles.js || ''}\n${usesReact ? codeFiles.react : ''}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.min.css" rel="stylesheet" type="text/css" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.css" rel="stylesheet" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
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
  <style>
    :root {
      color-scheme: light dark;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-text-size-adjust: 100%;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      color: #0f172a;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      line-height: 1.5;
    }

    body {
      min-height: 100%;
      overflow: auto;
    }

    /* Universal box-sizing for consistency */
    *, *::before, *::after {
      box-sizing: border-box;
    }

    /* Ensure #app and root elements fill the frame */
    #app, #root {
      width: 100%;
      min-height: 100%;
      display: block;
    }
${codeFiles.css || ''}
  </style>
  ${runtimeScripts}
</head>
<body>
  ${appRoot}
  ${usesReact ? `<script type="text/babel" data-presets="react">
${scriptBody}
lucide.createIcons();
  </script>` : `<script type="text/javascript">
${scriptBody}
lucide.createIcons();
  </script>`}
</body>
</html>`;
}

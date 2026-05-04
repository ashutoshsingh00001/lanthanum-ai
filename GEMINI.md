# Lanthanum AI
A full stack web application that lets users build macOS and Windows desktop apps visually + with code, powered by Electron, with AI assistance.

# The Three View Modes
Button 1 — Code View

Shows a full Monaco Editor (VS Code-like)
User can directly edit HTML, CSS, JS
Supports syntax highlighting, autocomplete
Changes reflect in other views

Button 2 — Render UI View

Shows a live preview of the app being built
Renders the actual HTML/CSS/JS output
Like seeing your Electron app window in the browser
Updates seamlessly as code changes

Button 3 — Component + Edit View

This is your biggest differentiator
User clicks any element in the UI (button, div, navbar etc.)
A panel opens showing that component's CSS properties
User can edit margin, padding, color, font, border etc. visually
Changes write back to the code automatically
Like browser DevTools but friendlier and built-in

# The Component System

Generated App
      ↓
AI also generates a JSON of all components
      ↓
{
  "components": [
    { "id": "btn-1", "type": "button", "text": "Click me",
      "css": { "color": "white", "background": "#333", "padding": "8px 16px" }
    },
    { "id": "sidebar-1", "type": "div", "role": "sidebar",
      "css": { "width": "250px", "background": "#1a1a1a" }
    }
  ]
}
      ↓
This JSON powers the component selector and CSS editor panel

# Framework Support

User can choose their stack before building:
FrontendStylingBuilderVanilla HTML/JSPlain CSSElectronReact JSTailwind CSSElectronVue JSBootstrapElectronSvelteCustom CSSElectron
The AI generates code accordingly based on chosen framework.

Your Tool
    ↓
Packages everything into a zip
    ↓
├── package.json
├── main.js          ← Electron entry
├── index.html       ← or React build
├── style.css
├── app.js
└── README.md        ← instructions to run
    ↓
User downloads zip
    ↓
npm install → npm start → App runs on macOS / Windows

# The Full User Journey

1. Open your web tool
2. Choose framework (Vanilla / React / Vue + CSS / Tailwind)
3. Type in AI chat: "Build me a note taking app with dark sidebar"
4. AI generates full Electron project code + component JSON
5. Switch to Render View → see the app live
6. Switch to Component View → click the sidebar → change its color
7. Switch to Code View → fine tune the JS logic
8. Export → download zip → run locally as a real desktop app



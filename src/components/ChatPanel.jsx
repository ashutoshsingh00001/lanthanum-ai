import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ExternalLink, Paintbrush, MessageSquare, Copy, Check } from 'lucide-react';
import { extractHtmlFromResponse, extractDescription, streamGemini, callGemini, UI_SYSTEM_PROMPT } from '../services/aiService';
import { useCanvas } from '../state/CanvasContext';
import StyleEditorPanel from './StyleEditorPanel';


// ── Message Renderer — parses code blocks from streamed text ──────────────────
function parseMessageParts(content) {
  const parts = [];
  if (!content) return parts;

  let remaining = content;
  let blockIdx = 0;

  while (remaining.length > 0) {
    // Look for the start of a code fence
    const fenceStart = remaining.indexOf('```');

    if (fenceStart === -1) {
      // No more code fences — rest is plain text
      parts.push({ type: 'text', content: remaining });
      break;
    }

    // Text before the fence
    if (fenceStart > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, fenceStart) });
    }

    // After the opening ```
    const afterFence = remaining.slice(fenceStart + 3);

    // Extract language (everything up to first newline or end of string)
    const newlinePos = afterFence.indexOf('\n');
    let lang, codeStart;

    if (newlinePos === -1) {
      // No newline yet — still typing the language or just opened
      lang = afterFence.trim() || 'code';
      // This is an incomplete opening fence, show as streaming code block
      parts.push({ type: 'code', lang, content: '', idx: blockIdx++, streaming: true });
      break;
    } else {
      lang = afterFence.slice(0, newlinePos).trim() || 'code';
      codeStart = newlinePos + 1;
    }

    // Look for closing fence
    const codeContent = afterFence.slice(codeStart);
    const closingFence = codeContent.indexOf('```');

    if (closingFence === -1) {
      // No closing fence — code block is still streaming
      parts.push({ type: 'code', lang, content: codeContent, idx: blockIdx++, streaming: true });
      break;
    } else {
      // Complete code block
      parts.push({ type: 'code', lang, content: codeContent.slice(0, closingFence), idx: blockIdx++ });
      remaining = codeContent.slice(closingFence + 3);
    }
  }

  return parts;
}

function MessageRenderer({ content }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopy = useCallback((code, idx) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }, []);

  if (!content) return null;

  const parts = parseMessageParts(content);

  if (parts.length === 0) return null;

  // If only one text part, render simply
  if (parts.length === 1 && parts[0].type === 'text') {
    const trimmed = parts[0].content.trim();
    if (!trimmed) return null;
    return (
      <div className="msg-text">
        {trimmed.split('\n').map((line, j) => (
          <p key={j}>{line}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="msg-rendered">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          const trimmed = part.content.trim();
          if (!trimmed) return null;
          return (
            <div key={i} className="msg-text">
              {trimmed.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          );
        }
        // Code block (complete or streaming)
        return (
          <div key={i} className={`msg-code-block ${part.streaming ? 'streaming' : ''}`}>
            <div className="msg-code-header">
              <span className="msg-code-lang">{part.lang}</span>
              {!part.streaming && part.content && (
                <button
                  className="msg-code-copy"
                  onClick={() => handleCopy(part.content, part.idx)}
                >
                  {copiedIdx === part.idx ? (
                    <><Check size={12} /><span>Copied</span></>
                  ) : (
                    <><Copy size={12} /><span>Copy</span></>
                  )}
                </button>
              )}
              {part.streaming && (
                <span className="msg-code-streaming">
                  <span className="streaming-dot"></span>
                  Generating...
                </span>
              )}
            </div>
            <pre className="msg-code-body"><code>{part.content}</code></pre>
          </div>
        );
      })}
    </div>
  );
}

const SUGGESTIONS = [
  { icon: '🖥️', text: 'Build a macOS music app UI' },
  { icon: '🪟', text: 'Create a Windows Game store app dashboard' },
  { icon: '📦', text: 'Design a Fitness App for macOs' },
  { icon: '⚡', text: 'Generate a productivity app interface for windows' },
];

export default function ChatPanel() {
  const { state, actions } = useCanvas();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'style'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-switch to Style Editor when Visual Editor is active
  useEffect(() => {
    if (state.viewMode === 'component') {
      setActiveTab('style');
    } else {
      setActiveTab('ai');
    }
  }, [state.viewMode]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Create a placeholder message for the assistant
    setMessages(prev => [...prev, { role: 'assistant', content: '', type: 'streaming' }]);

    try {
      // UI generation keywords
      const uiKeywords = ['design', 'create', 'make', 'generate', 'build', 'ui', 'page', 'dashboard', 'login', 'form', 'card', 'button', 'navbar', 'menu', 'hero', 'section', 'landing', 'website', 'web', 'app'];
      const isUiRequest = uiKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

      let finalContent = '';

      if (isUiRequest) {
        for await (const update of streamGemini(UI_SYSTEM_PROMPT, userMessage, messages)) {
          finalContent = update.fullContent;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1].content = finalContent;
            return next;
          });
        }

        const html = extractHtmlFromResponse(finalContent);
        const description = extractDescription(finalContent);

        if (html) {
          actions.setMainCode(html);
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: `✓ UI generated: ${description}`,
              type: 'ui-generated',
            };
            return next;
          });
        } else {
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1].type = 'message';
            return next;
          });
        }
      } else {
        const response = await callGemini(
          'You are Lanthanum AI, a friendly assistant for generating desktop app UIs. Reply conversationally and briefly. If the user wants a UI, ask them what macOS or Windows app they want to build. Never respond with JSON unless the user explicitly asks for code.',
          userMessage,
          messages
        );

        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: response || 'Tell me what desktop app UI you want to build.',
            type: 'message',
          };
          return next;
        });
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: `⚠️ Error: ${error.message}`,
          type: 'error',
        };
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="chat-panel">
      {/* Tab Toggle */}
      <div className="panel-tab-bar">
        <button
          className={`panel-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <MessageSquare size={13} />
          <span>Chat</span>
        </button>
        <button
          className={`panel-tab-btn ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
        >
          <Paintbrush size={13} />
          <span>Style Editor</span>
        </button>
      </div>

      {/* Style Editor tab */}
      {activeTab === 'style' && <StyleEditorPanel />}

      {/* AI Chat tab */}
      {activeTab === 'ai' && (<>
        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="welcome-state">
              <div>
                <img className="icon-wrapper" src="src/assets/LA.png" alt="Logo" />
              </div>
              <h3>Design with Lanthanum AI</h3>
              <p>
                Describe the desktop app you want to build for macOS or Windows, and I will generate the UI for you.
              </p>
              <div className="welcome-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(s.text)}
                  >
                    <span>{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  <div className="message-content">
                    {msg.role === 'user' ? (
                      <div>{msg.content}</div>
                    ) : (
                      <MessageRenderer content={msg.content} />
                    )}
                    {msg.type === 'ui-generated' && (
                      <div className="action-card">
                        <ExternalLink size={14} />
                        <span>UI rendered</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message ai">
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the app...."
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </>)}
    </div>
  );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Wand2, ExternalLink, Paintbrush, MessageSquare } from 'lucide-react';
import { extractHtmlFromResponse, extractDescription, streamGemini, callGemini, UI_SYSTEM_PROMPT } from '../services/aiService';
import { executeToolCalls, getCanvasContext } from '../services/agentService';
import { useCanvas } from '../state/CanvasContext';
import StyleEditorPanel from './StyleEditorPanel';

const SUGGESTIONS = [
  { icon: '🖥️', text: 'Build a macOS desktop app UI' },
  { icon: '🪟', text: 'Create a Windows app dashboard' },
  { icon: '📦', text: 'Design a settings screen for a desktop app' },
  { icon: '⚡', text: 'Generate a productivity app interface' },
];

export default function ChatPanel() {
  const { state, actions } = useCanvas();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'style'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
        // Use agent action (non-streaming for now as it's JSON)
        const contextInfo = getCanvasContext(state);
        const contextStr = contextInfo.length > 0
          ? `\n\nCurrent canvas elements:\n${JSON.stringify(contextInfo, null, 2)}`
          : '\n\nThe canvas is currently empty.';

        const response = await callGemini(
          'You are a design agent. Respond ONLY with a JSON array of tool calls.', 
          userMessage + contextStr, 
          messages
        );
        
        const toolCalls = JSON.parse(response.match(/\[[\s\S]*\]/)?.[0] || '[]');

        if (toolCalls.length > 0) {
          const executionResults = await executeToolCalls(toolCalls, actions);
          const summary = executionResults.map(r =>
            r.success ? `✓ ${r.result}` : `✗ ${r.tool}: ${r.error}`
          ).join('\n');

          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: summary,
              type: 'agent-action',
              toolCalls: toolCalls,
            };
            return next;
          });
        } else {
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              role: 'assistant',
              content: response || 'I couldn\'t understand what actions to perform.',
              type: 'message',
            };
            return next;
          });
        }
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
          <span>AI Chat</span>
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
                  <div>{msg.content}</div>
                  {msg.type === 'ui-generated' && (
                    <div className="action-card">
                      <ExternalLink size={14} />
                      <span>UI rendered</span>
                    </div>
                  )}
                  {msg.type === 'agent-action' && (
                    <div className="action-card">
                      <Wand2 size={14} />
                      <span>{msg.toolCalls?.length || 0} action(s) executed</span>
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
            placeholder="Describe a UI or tell the agent what to do..."
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

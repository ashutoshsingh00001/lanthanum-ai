import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Save, Loader2, Code2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useCanvas } from '../state/CanvasContext';
import { FaHtml5 } from 'react-icons/fa';

export default function CodeEditorPanel() {
  const { state, actions } = useCanvas();
  const { mainCode, theme } = state;
  const [isSaving, setIsSaving] = useState(false);
  
  const FILE_TABS = [
    { id: 'html', label: 'index.html', language: 'html', icon: FaHtml5 },
  ];

  const [activeTab, setActiveTab] = useState('html');
  const [code, setCode] = useState(mainCode || '');
  const [openTabs, setOpenTabs] = useState(['html']);
  const editorRef = useRef(null);

  // Sync with global state only on mount or when code changes externally
  useEffect(() => {
    if (mainCode !== code) {
      setCode(mainCode || '');
    }
  }, [mainCode]);

  const activeTabMeta = useMemo(
    () => FILE_TABS.find((tab) => tab.id === activeTab) || FILE_TABS[0],
    [activeTab]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      actions.setMainCode(code);
    } catch (error) {
      console.error('Failed to save code:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <div className="code-editor-panel">
      <div className="code-editor-header">
        <div className="code-editor-header-left">
          <Code2 size={16} />
          <h3>Source Code</h3>
        </div>
        <div className="code-editor-actions">
          <button
            type="button"
            className="code-editor-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="code-editor-workbench">
        <aside className="code-file-tabs">
          <div className="code-file-tabs-title">EXPLORER</div>
          <div className="code-file-tree-title">Web Project</div>
          {FILE_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
            <button
              key={tab.id}
              type="button"
              className={`code-file-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="code-file-tab-icon"><Icon size={14} /></span>
              {tab.label}
            </button>
            );
          })}
        </aside>
        <div className="code-editor-main">
          <div className="code-editor-topbar tabs">
            {openTabs.map((tabId) => {
              const tab = FILE_TABS.find((item) => item.id === tabId);
              if (!tab) return null;
              const Icon = tab.icon || FaHtml5;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`code-open-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="code-open-tab-label">
                    <Icon size={13} />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
          <Editor
            className="code-editor-monaco"
            language={activeTabMeta.language}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={code}
            onMount={handleEditorMount}
            onChange={(value) => setCode(value ?? '')}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              automaticLayout: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              tabSize: 2,
              insertSpaces: true,
              cursorBlinking: 'smooth',
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              padding: { top: 12, bottom: 12 },
              readOnly: isSaving
            }}
          />
          <div className="code-editor-statusbar">
            <span>UTF-8</span>
            <span>LF</span>
            <span>{activeTabMeta.language}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

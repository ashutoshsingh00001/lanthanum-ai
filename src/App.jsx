import React from 'react';
import { loader } from '@monaco-editor/react';
import { CanvasProvider, useCanvas } from './state/CanvasContext';
import ChatPanel from './components/ChatPanel';
import InteractivePreview from './components/InteractivePreview';
import CodeEditorPanel from './components/CodeEditorPanel';
import Header from './components/Header';
import { Code2, Layout, MousePointer2 } from 'lucide-react';

// Start downloading the massive VS Code engine in the background immediately!
loader.init();

function AppContent() {
  const { state, actions } = useCanvas();
  const { viewMode } = state;

  return (
    <div className="app-container">
      <Header />
      <div className="app-layout">
        <ChatPanel />
        <main className="main-content">
          <div className="view-switcher">
            <button className={`view-btn ${viewMode === 'code' ? 'active' : ''}`} onClick={() => actions.setViewMode('code')}>
              <Code2 size={16} /><span>Code</span>
            </button>
            <button className={`view-btn ${viewMode === 'preview' ? 'active' : ''}`} onClick={() => actions.setViewMode('preview')}>
              <Layout size={16} /><span>Render UI</span>
            </button>
            <button className={`view-btn ${viewMode === 'component' ? 'active' : ''}`} onClick={() => actions.setViewMode('component')}>
              <MousePointer2 size={16} /><span>Visual Editor</span>
            </button>
          </div>

          <div className="view-container">
            {viewMode === 'code' && <CodeEditorPanel />}
            {viewMode === 'preview' && <InteractivePreview />}
            {viewMode === 'component' && <InteractivePreview interactive />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CanvasProvider>
      <AppContent />
    </CanvasProvider>
  );
}

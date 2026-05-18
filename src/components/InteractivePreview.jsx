import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useCanvas } from '../state/CanvasContext';
import { callGemini } from '../services/aiService';
import { ArrowUp, Loader2, X } from 'lucide-react';

// Always injected — prevents link navigation and form submissions inside the iframe
const NAV_BLOCKER_SCRIPT = `
<script>
(function() {
  document.addEventListener('click', function(e) {
    const a = e.target.closest('a[href]');
    if (a) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener('submit', function(e) { e.preventDefault(); }, true);
})();
</script>`;


// Inspector injected only in interactive (Visual Editor) mode
const INSPECTOR_SCRIPT = `
<style>
  .__lanthanum-selected {
    outline: 2px solid #FB8733 !important;
    outline-offset: 2px !important;
  }
  .__lanthanum-hovered {
    outline: 1px dashed rgba(251,135,51,0.4) !important;
    outline-offset: 1px !important;
  }
</style>
<script>
(function() {
  let nextId = 1;
  let sel = null;

  function assignIds() {
    document.querySelectorAll('body *').forEach(el => {
      if (!el.getAttribute('data-lid')) el.setAttribute('data-lid', 'el_' + nextId++);
    });
  }
  assignIds();

  function clearSelection() {
    if (sel) {
      sel.classList.remove('__lanthanum-selected');
      sel = null;
    }
    window.parent.postMessage({ type: 'ELEMENT_DESELECTED' }, '*');
  }

  function selectElement(el) {
    if (sel === el) return;
    // Clear previous
    if (sel) sel.classList.remove('__lanthanum-selected');
    // Remove hover from new target
    el.classList.remove('__lanthanum-hovered');
    // Set new selection
    sel = el;
    sel.classList.add('__lanthanum-selected');

    const rect = sel.getBoundingClientRect();
    window.parent.postMessage({
      type: 'ELEMENT_SELECTED',
      id: sel.getAttribute('data-lid') || sel.id,
      tag: sel.tagName.toLowerCase(),
      rect: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right, width: rect.width, height: rect.height },
      styles: sel.getAttribute('style') || '',
      outerHTML: sel.outerHTML.slice(0, 600),
    }, '*');
  }

  document.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    // Click on body or html = deselect
    if (target === document.body || target === document.documentElement) {
      clearSelection();
      return;
    }
    selectElement(target);
  }, true);

  document.addEventListener('dblclick', e => {
    e.preventDefault();
    e.stopPropagation();
    clearSelection();
  }, true);

  document.addEventListener('mouseover', e => {
    const target = e.target;
    if (target === sel || target === document.body || target === document.documentElement) return;
    target.classList.add('__lanthanum-hovered');
  }, true);

  document.addEventListener('mouseout', e => {
    const target = e.target;
    if (target === sel) return;
    target.classList.remove('__lanthanum-hovered');
  }, true);

  window.addEventListener('message', e => {
    const { type, id, styles } = e.data || {};
    if (type === 'APPLY_STYLES' && id && styles) {
      const el = document.querySelector('[data-lid="' + id + '"]') || document.getElementById(id);
      if (el) Object.entries(styles).forEach(([p, v]) => { el.style[p] = v; });
    }
    if (type === 'CLEAR_SELECTION') {
      clearSelection();
    }
  });

  new MutationObserver(assignIds).observe(document.body, { childList: true, subtree: true });
})();
</script>`;

function AiBubble({ selection, onClose, onApply }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); setPrompt(''); }, [selection?.id]);
  if (!selection) return null;

  const IFRAME_TOP = 0;
  const top = IFRAME_TOP + selection.rect.bottom + 8;
  const left = Math.max(8, selection.rect.left + selection.rect.width / 2 - 155);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const sys = `You are a CSS expert. Return ONLY a raw JSON object with camelCase CSS property names. No markdown. Example: {"backgroundColor":"#7c3aed","borderRadius":"12px"}`;
      const res = await callGemini(sys, `Element: <${selection.tag}>\nInline style: ${selection.styles}\nHTML: ${selection.outerHTML}\nRequest: ${prompt}`, []);
      const match = res.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('no json');
      onApply(selection.id, JSON.parse(match[0]));
      setPrompt('');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="ai-bubble" style={{ top: `${top}px`, left: `${left}px` }} onClick={e => e.stopPropagation()}>
      <div className="ai-bubble-tag">
        <span className="ai-bubble-tag-icon">⬚</span>
        <span>&lt;{selection.tag}&gt;</span>
        <button className="ai-bubble-close" onClick={onClose}><X size={10} /></button>
      </div>
      <div className="ai-bubble-input-row">
        <input ref={inputRef} type="text" className="ai-bubble-input" placeholder="Ask AI to edit..."
          value={prompt} onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={loading} />
        <button className="ai-bubble-send" onClick={handleSend} disabled={loading || !prompt.trim()}>
          {loading ? <Loader2 size={12} className="spin" /> : <ArrowUp size={12} />}
        </button>
      </div>
    </div>
  );
}

export default function InteractivePreview({ interactive = false }) {
  const { state } = useCanvas();
  const { mainCode } = state;
  const iframeRef = useRef(null);
  const [selection, setSelection] = useState(null);

  const empty = `<!DOCTYPE html><html><head><style>body{margin:0;background:#0a0a0f;height:100vh;display:flex;align-items:center;justify-content:center;}</style></head><body></body></html>`;

  const finalCode = useMemo(() => {
    const code = mainCode || empty;
    // Always inject nav blocker to prevent link navigation inside iframe
    const extras = interactive
      ? NAV_BLOCKER_SCRIPT + INSPECTOR_SCRIPT
      : NAV_BLOCKER_SCRIPT;
    return code.includes('</body>')
      ? code.replace('</body>', `${extras}</body>`)
      : code + extras;
  }, [mainCode, interactive]);

  useEffect(() => {
    if (!interactive) return;
    const handler = e => {
      if (e.data?.type === 'ELEMENT_SELECTED') setSelection({ id: e.data.id, tag: e.data.tag, rect: e.data.rect, styles: e.data.styles, outerHTML: e.data.outerHTML });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [interactive]);

  const handleApply = useCallback((id, changes) => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'APPLY_STYLES', id, styles: changes }, '*');
    setSelection(prev => prev ? { ...prev, styles: JSON.stringify(changes) } : prev);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a0f', position: 'relative', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--glass-border)' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <iframe ref={iframeRef} title={interactive ? 'Visual Editor' : 'Render UI'}
          srcDoc={finalCode} style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-scripts allow-same-origin" />
        {interactive && (
          <AiBubble selection={selection} onClose={() => setSelection(null)} onApply={handleApply} />
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { useCanvas } from '../state/CanvasContext';
import {
  Monitor, Tablet, Smartphone,
  RotateCcw, RotateCw, ChevronDown, ChevronRight,
  Link, MousePointer2
} from 'lucide-react';

// ─── Default HTML loaded on first render ───────────────────────────────────
const DEFAULT_HTML = `
<section style="min-height:100vh;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter',sans-serif;padding:40px 20px;">
  <div id="hero-badge" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:999px;padding:6px 18px;font-size:12px;color:#a78bfa;letter-spacing:0.08em;margin-bottom:24px;backdrop-filter:blur(8px);">
    ✨ AI-Powered Design Tool
  </div>
  <h1 id="hero-title" style="font-size:clamp(2rem,5vw,4rem);font-weight:800;color:#fff;text-align:center;line-height:1.1;margin:0 0 20px;letter-spacing:-0.02em;">
    Build Beautiful<br/><span style="background:linear-gradient(90deg,#a78bfa,#fb923c);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">UI Visually</span>
  </h1>
  <p id="hero-sub" style="font-size:1.125rem;color:rgba(255,255,255,0.6);text-align:center;max-width:520px;line-height:1.7;margin:0 0 40px;">
    Select any element, edit styles in real-time, or let AI enhance your design with one click.
  </p>
  <div id="hero-buttons" style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
    <button id="btn-primary" style="padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#db2777);border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;box-shadow:0 8px 24px rgba(124,58,237,0.4);">
      Get Started →
    </button>
    <button id="btn-secondary" style="padding:14px 32px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:12px;color:#fff;font-size:15px;font-weight:600;cursor:pointer;backdrop-filter:blur(8px);">
      View Demo
    </button>
  </div>
  <div id="stats-row" style="display:flex;gap:48px;margin-top:64px;flex-wrap:wrap;justify-content:center;">
    <div id="stat-1" style="text-align:center;">
      <div style="font-size:2rem;font-weight:700;color:#a78bfa;">10k+</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">Projects Built</div>
    </div>
    <div id="stat-2" style="text-align:center;">
      <div style="font-size:2rem;font-weight:700;color:#fb923c;">99%</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">Satisfaction</div>
    </div>
    <div id="stat-3" style="text-align:center;">
      <div style="font-size:2rem;font-weight:700;color:#34d399;">3x</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px;">Faster Design</div>
    </div>
  </div>
</section>
`;

// ─── CSS Property Control Components ──────────────────────────────────────

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="gjs-prop-section">
      <button className="gjs-prop-section-header" onClick={() => setOpen(o => !o)}>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span>{title}</span>
      </button>
      {open && <div className="gjs-prop-section-body">{children}</div>}
    </div>
  );
}

function PropRow({ label, children }) {
  return (
    <div className="gjs-prop-row">
      <label className="gjs-prop-label">{label}</label>
      <div className="gjs-prop-control">{children}</div>
    </div>
  );
}

function SpacingControl({ values, onChange, locked, onToggleLock }) {
  const sides = ['Top', 'Right', 'Bottom', 'Left'];
  const handleChange = (side, val) => {
    if (locked) {
      const all = {};
      sides.forEach(s => all[s.toLowerCase()] = val);
      onChange(all);
    } else {
      onChange({ [side.toLowerCase()]: val });
    }
  };

  return (
    <div className="gjs-spacing-control">
      <div className="gjs-spacing-inputs">
        {sides.map(side => (
          <div key={side} className="gjs-spacing-field">
            <input
              type="text"
              value={values[side.toLowerCase()] || ''}
              onChange={e => handleChange(side, e.target.value)}
              placeholder="—"
            />
            <span className="gjs-spacing-label">{side[0]}</span>
          </div>
        ))}
      </div>
      <button
        className={`gjs-lock-btn ${locked ? 'locked' : ''}`}
        onClick={onToggleLock}
        title={locked ? 'Unlock sides' : 'Lock sides'}
      >
        <Link size={11} />
      </button>
    </div>
  );
}

// Inject all <head> resources from a parsed HTML doc into the GrapesJS canvas iframe
function injectHeadIntoCanvas(editor, doc) {
  const headEls = Array.from(doc.head.children);
  const bodyStyle = doc.body.getAttribute('style') || '';

  const run = (attempts = 0) => {
    const canvasDoc = editor.Canvas?.getDocument?.();
    if (!canvasDoc) {
      if (attempts < 20) setTimeout(() => run(attempts + 1), 150);
      return;
    }

    const head = canvasDoc.head;
    const body = canvasDoc.body;

    // Remove previously injected nodes
    head.querySelectorAll('[data-la-injected]').forEach(el => el.remove());

    // Apply body-level inline styles (background, font, etc.)
    if (bodyStyle) {
      body.setAttribute('style', bodyStyle);
    }

    // Re-inject all head elements
    headEls.forEach(node => {
      const tag = node.tagName.toLowerCase();
      try {
        const el = canvasDoc.createElement(tag);
        el.setAttribute('data-la-injected', '1');

        if (tag === 'link') {
          if (node.rel) el.rel = node.rel;
          if (node.href) el.href = node.href;
          if (node.type) el.type = node.type;
          if (node.crossOrigin) el.crossOrigin = node.crossOrigin;
        } else if (tag === 'style') {
          el.textContent = node.textContent;
        } else if (tag === 'script') {
          if (node.src) el.src = node.src;
          else el.textContent = node.textContent;
          if (node.type) el.type = node.type;
        } else if (tag === 'meta') {
          Array.from(node.attributes).forEach(a => el.setAttribute(a.name, a.value));
        }

        head.appendChild(el);
      } catch (e) { /* skip */ }
    });
  };

  setTimeout(() => run(), 100);
}

// ─── Main GrapesEditor Component ──────────────────────────────────────────

export default function GrapesEditor() {
  const { state } = useCanvas();
  const { mainCode } = state;

  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const selectedRef = useRef(null);

  const [selectedComp, setSelectedComp] = useState(null);
  const [styles, setStyles] = useState({});
  const [device, setDevice] = useState('desktop');
  const [marginLocked, setMarginLocked] = useState(true);
  const [paddingLocked, setPaddingLocked] = useState(true);

  // ── Init GrapesJS once ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: '100%',
      storageManager: false,
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '375px', widthMedia: '480px' },
        ],
      },
      panels: { defaults: [] }, // hide built-in panels
      blockManager: { appendTo: 'none' },
      styleManager: { appendTo: 'none' },
      layerManager: { appendTo: 'none' },
      traitManager: { appendTo: 'none' },
      commands: {
        defaults: [
          {
            id: 'select-parent',
            run(ed) { ed.getSelected()?.parent()?.view?.el?.click(); },
          },
        ],
      },
    });

    // If AI has already generated code, load it; otherwise load default
    if (mainCode) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(mainCode, 'text/html');
      editor.setComponents(doc.body.innerHTML);
      injectHeadIntoCanvas(editor, doc);
    } else {
      editor.setComponents(DEFAULT_HTML);
    }

    // ── Component selection ──────────────────────────────────────────
    editor.on('component:selected', comp => {
      selectedRef.current = comp;
      setSelectedComp({ id: comp.getId(), type: comp.get('type'), tag: comp.get('tagName') });

      const raw = comp.getStyle();
      const computed = {};
      // Flatten style object
      Object.keys(raw).forEach(k => { computed[k] = raw[k]; });
      setStyles(computed);
    });

    editor.on('component:deselected', () => {
      selectedRef.current = null;
      setSelectedComp(null);
      setStyles({});
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  // ── Reload when AI generates new code ─────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !mainCode) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(mainCode, 'text/html');
    editor.setComponents(doc.body.innerHTML);
    injectHeadIntoCanvas(editor, doc);
  }, [mainCode]);


  // ── Device switching ──────────────────────────────────────────────────
  const setDeviceMode = useCallback((mode) => {
    setDevice(mode);
    if (!editorRef.current) return;
    const map = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' };
    editorRef.current.setDevice(map[mode]);
  }, []);

  // ── Apply a style prop to selected component ─────────────────────────
  const applyStyle = useCallback((prop, value) => {
    const comp = selectedRef.current;
    if (!comp) return;
    comp.addStyle({ [prop]: value });
    setStyles(prev => ({ ...prev, [prop]: value }));
  }, []);

  const applyStyles = useCallback((styleObj) => {
    const comp = selectedRef.current;
    if (!comp) return;
    comp.addStyle(styleObj);
    setStyles(prev => ({ ...prev, ...styleObj }));
  }, []);

  // ── Spacing helpers ───────────────────────────────────────────────────
  const getSpacing = (prefix) => ({
    top: styles[`${prefix}-top`] || '',
    right: styles[`${prefix}-right`] || '',
    bottom: styles[`${prefix}-bottom`] || '',
    left: styles[`${prefix}-left`] || '',
  });

  const applySpacing = (prefix, vals) => {
    const update = {};
    Object.entries(vals).forEach(([side, val]) => {
      update[`${prefix}-${side}`] = val;
    });
    applyStyles(update);
  };

  // ── Undo / Redo ───────────────────────────────────────────────────────
  const undo = () => editorRef.current?.UndoManager.undo();
  const redo = () => editorRef.current?.UndoManager.redo();

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div className="gjs-editor-wrapper">

      {/* ── Left Style Panel ─────────────────────────────────────────── */}
      <aside className="gjs-style-panel">
        <div className="gjs-panel-header">
          <span className="gjs-panel-title">Style Editor</span>
          <div className="gjs-device-btns">
            <button
              className={`gjs-dev-btn ${device === 'desktop' ? 'active' : ''}`}
              onClick={() => setDeviceMode('desktop')} title="Desktop"
            ><Monitor size={14} /></button>
            <button
              className={`gjs-dev-btn ${device === 'tablet' ? 'active' : ''}`}
              onClick={() => setDeviceMode('tablet')} title="Tablet"
            ><Tablet size={14} /></button>
            <button
              className={`gjs-dev-btn ${device === 'mobile' ? 'active' : ''}`}
              onClick={() => setDeviceMode('mobile')} title="Mobile"
            ><Smartphone size={14} /></button>
          </div>
        </div>

        {/* Undo/Redo */}
        <div className="gjs-history-bar">
          <button className="gjs-hist-btn" onClick={undo} title="Undo"><RotateCcw size={13} /></button>
          <button className="gjs-hist-btn" onClick={redo} title="Redo"><RotateCw size={13} /></button>
          <span className="gjs-sel-badge">
            {selectedComp
              ? `<${selectedComp.tag || selectedComp.type}>`
              : 'No selection'}
          </span>
        </div>

        {!selectedComp ? (
          <div className="gjs-no-sel">
            <MousePointer2 size={28} />
            <p>Click any element in the canvas to edit its styles</p>
          </div>
        ) : (
          <div className="gjs-props-scroll">

            {/* Typography */}
            <Section title="TYPOGRAPHY">
              <PropRow label="Font Size">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['font-size'] || ''}
                  onChange={e => applyStyle('font-size', e.target.value)}
                  placeholder="16px"
                />
              </PropRow>
              <PropRow label="Font Weight">
                <select
                  className="gjs-select"
                  value={styles['font-weight'] || '400'}
                  onChange={e => applyStyle('font-weight', e.target.value)}
                >
                  {['100', '200', '300', '400', '500', '600', '700', '800', '900'].map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </PropRow>
              <PropRow label="Line Height">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['line-height'] || ''}
                  onChange={e => applyStyle('line-height', e.target.value)}
                  placeholder="1.5"
                />
              </PropRow>
              <PropRow label="Text Align">
                <select
                  className="gjs-select"
                  value={styles['text-align'] || 'left'}
                  onChange={e => applyStyle('text-align', e.target.value)}
                >
                  {['left', 'center', 'right', 'justify'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </PropRow>
            </Section>

            {/* Colors */}
            <Section title="COLORS">
              <PropRow label="Text">
                <div className="gjs-color-row">
                  <input
                    type="color"
                    className="gjs-color-swatch"
                    value={styles['color'] && styles['color'].startsWith('#') ? styles['color'].slice(0, 7) : '#ffffff'}
                    onChange={e => applyStyle('color', e.target.value)}
                  />
                  <input
                    type="text"
                    className="gjs-input"
                    value={styles['color'] || ''}
                    onChange={e => applyStyle('color', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </PropRow>
              <PropRow label="Background">
                <div className="gjs-color-row">
                  <input
                    type="color"
                    className="gjs-color-swatch"
                    value={styles['background-color'] && styles['background-color'].startsWith('#') ? styles['background-color'].slice(0, 7) : '#000000'}
                    onChange={e => applyStyle('background-color', e.target.value)}
                  />
                  <input
                    type="text"
                    className="gjs-input"
                    value={styles['background'] || styles['background-color'] || ''}
                    onChange={e => applyStyle('background', e.target.value)}
                    placeholder="transparent"
                  />
                </div>
              </PropRow>
            </Section>

            {/* Spacing */}
            <Section title="SPACING">
              <div className="gjs-spacing-block">
                <div className="gjs-spacing-title">
                  <span>Margin</span>
                </div>
                <SpacingControl
                  values={getSpacing('margin')}
                  onChange={vals => applySpacing('margin', vals)}
                  locked={marginLocked}
                  onToggleLock={() => setMarginLocked(l => !l)}
                />
              </div>
              <div className="gjs-spacing-block">
                <div className="gjs-spacing-title">
                  <span>Padding</span>
                </div>
                <SpacingControl
                  values={getSpacing('padding')}
                  onChange={vals => applySpacing('padding', vals)}
                  locked={paddingLocked}
                  onToggleLock={() => setPaddingLocked(l => !l)}
                />
              </div>
            </Section>

            {/* Size */}
            <Section title="SIZE">
              <PropRow label="Width">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['width'] || ''}
                  onChange={e => applyStyle('width', e.target.value)}
                  placeholder="auto"
                />
              </PropRow>
              <PropRow label="Height">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['height'] || ''}
                  onChange={e => applyStyle('height', e.target.value)}
                  placeholder="auto"
                />
              </PropRow>
              <PropRow label="Max Width">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['max-width'] || ''}
                  onChange={e => applyStyle('max-width', e.target.value)}
                  placeholder="none"
                />
              </PropRow>
            </Section>

            {/* Border */}
            <Section title="BORDER">
              <PropRow label="Radius">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['border-radius'] || ''}
                  onChange={e => applyStyle('border-radius', e.target.value)}
                  placeholder="0px"
                />
              </PropRow>
              <PropRow label="Width">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['border-width'] || ''}
                  onChange={e => applyStyle('border-width', e.target.value)}
                  placeholder="0px"
                />
              </PropRow>
              <PropRow label="Style">
                <select
                  className="gjs-select"
                  value={styles['border-style'] || 'none'}
                  onChange={e => applyStyle('border-style', e.target.value)}
                >
                  {['none', 'solid', 'dashed', 'dotted', 'double'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </PropRow>
              <PropRow label="Color">
                <div className="gjs-color-row">
                  <input
                    type="color"
                    className="gjs-color-swatch"
                    value={styles['border-color'] && styles['border-color'].startsWith('#') ? styles['border-color'].slice(0, 7) : '#000000'}
                    onChange={e => applyStyle('border-color', e.target.value)}
                  />
                  <input
                    type="text"
                    className="gjs-input"
                    value={styles['border-color'] || ''}
                    onChange={e => applyStyle('border-color', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </PropRow>
            </Section>

            {/* Effects */}
            <Section title="EFFECTS">
              <PropRow label="Opacity">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={parseFloat(styles['opacity'] ?? 1)}
                    onChange={e => applyStyle('opacity', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 32, textAlign: 'right' }}>
                    {Math.round(parseFloat(styles['opacity'] ?? 1) * 100)}%
                  </span>
                </div>
              </PropRow>
              <PropRow label="Box Shadow">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['box-shadow'] || ''}
                  onChange={e => applyStyle('box-shadow', e.target.value)}
                  placeholder="0 4px 12px rgba(0,0,0,0.2)"
                />
              </PropRow>
              <PropRow label="Transition">
                <input
                  type="text"
                  className="gjs-input"
                  value={styles['transition'] || ''}
                  onChange={e => applyStyle('transition', e.target.value)}
                  placeholder="all 0.2s ease"
                />
              </PropRow>
            </Section>

          </div>
        )}

      </aside>

      {/* ── GrapesJS Canvas ──────────────────────────────────────────── */}
      <div className="gjs-canvas-area">
        <div ref={containerRef} className="gjs-mount" />
      </div>
    </div>
  );
}
